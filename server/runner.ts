import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { SupportedLanguage, SubmissionStatus } from '../src/types';

export interface ExecutionResult {
  status: SubmissionStatus;
  stdout: string;
  stderr: string;
  executionTimeMs: number;
  exitCode: number | null;
  timedOut: boolean;
}

export function normalizeOutput(output: string): string {
  return output
    .replace(/\r\n/g, '\n')
    .trim()
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n');
}

export async function executeSingle(
  language: SupportedLanguage,
  code: string,
  input: string,
  timeLimitMs: number = 3000
): Promise<ExecutionResult> {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ddc_run_'));
  const startTime = Date.now();

  try {
    if (language === 'python') {
      const scriptPath = path.join(tempDir, 'solution.py');
      fs.writeFileSync(scriptPath, code, 'utf8');

      return await new Promise<ExecutionResult>((resolve) => {
        let stdout = '';
        let stderr = '';
        let timedOut = false;

        const proc = spawn('python3', [scriptPath], {
          cwd: tempDir,
          timeout: timeLimitMs,
          env: {
            PATH: process.env.PATH || '/usr/local/bin:/usr/bin:/bin',
            PYTHONUNBUFFERED: '1',
            PYTHONDONTWRITEBYTECODE: '1',
          },
        });

        const timer = setTimeout(() => {
          timedOut = true;
          try {
            proc.kill('SIGKILL');
          } catch (_) {}
        }, timeLimitMs + 100);

        if (input) {
          proc.stdin.write(input);
        }
        proc.stdin.end();

        proc.stdout.on('data', (data) => {
          if (stdout.length < 65536) {
            stdout += data.toString();
          }
        });

        proc.stderr.on('data', (data) => {
          if (stderr.length < 65536) {
            stderr += data.toString();
          }
        });

        proc.on('close', (code, signal) => {
          clearTimeout(timer);
          const executionTimeMs = Date.now() - startTime;

          if (timedOut || signal === 'SIGKILL' || signal === 'SIGTERM') {
            resolve({
              status: 'Time Limit Exceeded',
              stdout,
              stderr: 'Time Limit Exceeded (' + timeLimitMs + 'ms limit)',
              executionTimeMs,
              exitCode: code,
              timedOut: true,
            });
          } else if (code !== 0) {
            resolve({
              status: 'Runtime Error',
              stdout,
              stderr: stderr || `Process exited with code ${code}`,
              executionTimeMs,
              exitCode: code,
              timedOut: false,
            });
          } else {
            resolve({
              status: 'Accepted',
              stdout,
              stderr,
              executionTimeMs,
              exitCode: 0,
              timedOut: false,
            });
          }
        });

        proc.on('error', (err) => {
          clearTimeout(timer);
          resolve({
            status: 'Runtime Error',
            stdout,
            stderr: err.message,
            executionTimeMs: Date.now() - startTime,
            exitCode: 1,
            timedOut: false,
          });
        });
      });
    } else if (language === 'c') {
      const sourcePath = path.join(tempDir, 'solution.c');
      const binPath = path.join(tempDir, 'solution.out');
      fs.writeFileSync(sourcePath, code, 'utf8');

      // Step 1: Compile with GCC
      const compileResult = await new Promise<{ success: boolean; stderr: string }>((resolve) => {
        let stderr = '';
        const compileProc = spawn('gcc', ['-O2', '-Wall', '-std=c11', sourcePath, '-o', binPath, '-lm'], {
          cwd: tempDir,
          timeout: 8000,
        });

        compileProc.stderr.on('data', (data) => {
          stderr += data.toString();
        });

        compileProc.on('close', (exitCode) => {
          resolve({ success: exitCode === 0, stderr });
        });

        compileProc.on('error', (err) => {
          resolve({ success: false, stderr: err.message });
        });
      });

      if (!compileResult.success) {
        return {
          status: 'Compilation Error',
          stdout: '',
          stderr: compileResult.stderr || 'Compilation failed',
          executionTimeMs: Date.now() - startTime,
          exitCode: 1,
          timedOut: false,
        };
      }

      // Step 2: Execute compiled binary
      const execStartTime = Date.now();
      return await new Promise<ExecutionResult>((resolve) => {
        let stdout = '';
        let stderr = '';
        let timedOut = false;

        const proc = spawn(binPath, [], {
          cwd: tempDir,
          timeout: timeLimitMs,
        });

        const timer = setTimeout(() => {
          timedOut = true;
          try {
            proc.kill('SIGKILL');
          } catch (_) {}
        }, timeLimitMs + 100);

        if (input) {
          proc.stdin.write(input);
        }
        proc.stdin.end();

        proc.stdout.on('data', (data) => {
          if (stdout.length < 65536) {
            stdout += data.toString();
          }
        });

        proc.stderr.on('data', (data) => {
          if (stderr.length < 65536) {
            stderr += data.toString();
          }
        });

        proc.on('close', (code, signal) => {
          clearTimeout(timer);
          const executionTimeMs = Date.now() - execStartTime;

          if (timedOut || signal === 'SIGKILL' || signal === 'SIGTERM') {
            resolve({
              status: 'Time Limit Exceeded',
              stdout,
              stderr: 'Time Limit Exceeded (' + timeLimitMs + 'ms limit)',
              executionTimeMs,
              exitCode: code,
              timedOut: true,
            });
          } else if (code !== 0) {
            resolve({
              status: 'Runtime Error',
              stdout,
              stderr: stderr || `Runtime exception (Exit code ${code})`,
              executionTimeMs,
              exitCode: code,
              timedOut: false,
            });
          } else {
            resolve({
              status: 'Accepted',
              stdout,
              stderr,
              executionTimeMs,
              exitCode: 0,
              timedOut: false,
            });
          }
        });

        proc.on('error', (err) => {
          clearTimeout(timer);
          resolve({
            status: 'Runtime Error',
            stdout,
            stderr: err.message,
            executionTimeMs: Date.now() - execStartTime,
            exitCode: 1,
            timedOut: false,
          });
        });
      });
    }

    throw new Error(`Unsupported language: ${language}`);
  } finally {
    // Cleanup temporary files
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch (_) {}
  }
}
