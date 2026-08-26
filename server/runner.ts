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
  if (output === null || output === undefined) return '';
  return String(output)
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .trim()
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n');
}

/**
 * Robust comparison function that handles common competitive programming
 * edge-cases (case sensitivity for booleans, flexible token spacing, etc.)
 */
export function compareOutputs(actual: string, expected: string): boolean {
  const normA = normalizeOutput(actual);
  const normE = normalizeOutput(expected);

  // 1. Direct exact match
  if (normA === normE) {
    return true;
  }

  // 2. Boolean case-insensitivity (e.g. Python "True" vs expected "true")
  const lowerA = normA.toLowerCase();
  const lowerE = normE.toLowerCase();
  if (
    (lowerE === 'true' || lowerE === 'false' || lowerE === 'valid' || lowerE === 'invalid') &&
    lowerA === lowerE
  ) {
    return true;
  }

  // 3. Direct case-insensitive match
  if (lowerA === lowerE) {
    return true;
  }

  // 4. Number equivalence (e.g. "42" vs "42.0" or "-0" vs "0")
  if (!isNaN(Number(normA)) && !isNaN(Number(normE))) {
    if (Math.abs(Number(normA) - Number(normE)) < 1e-6) {
      return true;
    }
  }

  // 5. Token & Whitespace collapsing (handles multiple space delimiters or trailing line differences)
  const collapseTokens = (text: string) =>
    text
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .split('\n')
      .map((l) => l.trim().replace(/[ \t]+/g, ' '))
      .filter((l) => l.length > 0)
      .join('\n');

  const tokensA = collapseTokens(normA);
  const tokensE = collapseTokens(normE);

  if (tokensA === tokensE) {
    return true;
  }

  if (tokensA.toLowerCase() === tokensE.toLowerCase()) {
    return true;
  }

  return false;
}

export async function executeSingle(
  language: SupportedLanguage,
  code: string,
  input: string,
  timeLimitMs: number = 3000
): Promise<ExecutionResult> {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ddc_run_'));
  const startTime = Date.now();

  // Normalize input string
  const cleanInput = input !== undefined && input !== null ? String(input).replace(/\r\n/g, '\n').replace(/\r/g, '\n') : '';
  const finalInput = cleanInput.length > 0 && !cleanInput.endsWith('\n') ? `${cleanInput}\n` : cleanInput;

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
            ...process.env,
            PATH: process.env.PATH || '/usr/local/bin:/usr/bin:/bin',
            PYTHONUNBUFFERED: '1',
            PYTHONDONTWRITEBYTECODE: '1',
            PYTHONIOENCODING: 'utf-8',
            LANG: 'en_US.UTF-8',
            LC_ALL: 'en_US.UTF-8',
          },
        });

        const timer = setTimeout(() => {
          timedOut = true;
          try {
            proc.kill('SIGKILL');
          } catch (_) {}
        }, timeLimitMs + 100);

        proc.stdin.on('error', () => {
          // Prevent EPIPE if child process exits early
        });

        if (finalInput) {
          try {
            proc.stdin.write(finalInput);
          } catch (_) {}
        }
        try {
          proc.stdin.end();
        } catch (_) {}

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
        const compileProc = spawn(
          'gcc',
          ['-O2', '-std=c11', sourcePath, '-o', binPath, '-lm'],
          {
            cwd: tempDir,
            timeout: 8000,
            env: process.env,
          }
        );

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
          env: process.env,
        });

        const timer = setTimeout(() => {
          timedOut = true;
          try {
            proc.kill('SIGKILL');
          } catch (_) {}
        }, timeLimitMs + 100);

        proc.stdin.on('error', () => {
          // Prevent EPIPE if child process exits early
        });

        if (finalInput) {
          try {
            proc.stdin.write(finalInput);
          } catch (_) {}
        }
        try {
          proc.stdin.end();
        } catch (_) {}

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
