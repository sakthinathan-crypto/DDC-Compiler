import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { SupportedLanguage, SubmissionStatus } from '../src/types';

export interface ExecutionOptions {
  language: SupportedLanguage;
  code: string;
  input: string;
  timeLimitMs?: number;
}

export interface ExecutionResult {
  status: SubmissionStatus;
  stdout: string;
  stderr: string;
  executionTimeMs: number;
  exitCode: number | null;
  timedOut: boolean;
  provider?: string;
}

export interface ICompilerProvider {
  name: string;
  isAvailable(): Promise<boolean>;
  execute(options: ExecutionOptions): Promise<ExecutionResult>;
}

/**
 * 1. Piston API Provider (Standard remote compiler engine)
 * Works out of the box on Vercel Serverless without requiring local gcc / python binaries.
 */
export class PistonCompilerProvider implements ICompilerProvider {
  public name = 'PistonRemote';
  private primaryUrl: string;
  private mirrorUrls: string[];

  constructor() {
    this.primaryUrl =
      process.env.PISTON_API_URL ||
      process.env.COMPILER_API_URL ||
      'https://emkc.org/api/v2/piston/execute';

    this.mirrorUrls = [
      this.primaryUrl,
      'https://piston.engineering/api/v2/piston/execute',
      'https://emkc.org/api/v2/piston/execute',
    ].filter((u, idx, arr) => arr.indexOf(u) === idx);
  }

  public async isAvailable(): Promise<boolean> {
    return true;
  }

  public async execute(options: ExecutionOptions): Promise<ExecutionResult> {
    const startTime = Date.now();
    const timeLimitMs = options.timeLimitMs || 3000;
    const cleanInput =
      options.input !== undefined && options.input !== null
        ? String(options.input).replace(/\r\n/g, '\n').replace(/\r/g, '\n')
        : '';

    const langName = options.language === 'c' ? 'c' : 'python';
    const langVersion = options.language === 'c' ? '10.2.0' : '3.10.0';
    const fileName = options.language === 'c' ? 'main.c' : 'main.py';

    const payload = {
      language: langName,
      version: langVersion,
      files: [
        {
          name: fileName,
          content: options.code,
        },
      ],
      stdin: cleanInput,
      args: [],
      compile_timeout: 10000,
      run_timeout: Math.max(timeLimitMs, 1000),
    };

    let lastError: Error | null = null;

    for (const endpoint of this.mirrorUrls) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeLimitMs + 12000);

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...(process.env.PISTON_API_KEY ? { Authorization: process.env.PISTON_API_KEY } : {}),
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`Piston API HTTP ${response.status}: ${errText}`);
        }

        const data: any = await response.json();
        const executionTimeMs = Date.now() - startTime;

        // Check for compilation errors
        if (data.compile && data.compile.code !== 0) {
          return {
            status: 'Compilation Error',
            stdout: data.compile.stdout || '',
            stderr: data.compile.stderr || data.compile.output || 'Compilation failed',
            executionTimeMs,
            exitCode: data.compile.code || 1,
            timedOut: false,
            provider: this.name,
          };
        }

        const runResult = data.run || {};
        const stdout = runResult.stdout || '';
        const stderr = runResult.stderr || '';
        const exitCode = runResult.code !== undefined ? runResult.code : 0;
        const signal = runResult.signal;

        const isTimeLimit =
          signal === 'SIGKILL' ||
          signal === 'SIGTERM' ||
          exitCode === 137 ||
          (runResult.output && String(runResult.output).toLowerCase().includes('timed out'));

        if (isTimeLimit) {
          return {
            status: 'Time Limit Exceeded',
            stdout,
            stderr: 'Time Limit Exceeded (' + timeLimitMs + 'ms limit)',
            executionTimeMs,
            exitCode,
            timedOut: true,
            provider: this.name,
          };
        }

        if (exitCode !== 0) {
          return {
            status: 'Runtime Error',
            stdout,
            stderr: stderr || `Process exited with code ${exitCode}`,
            executionTimeMs,
            exitCode,
            timedOut: false,
            provider: this.name,
          };
        }

        return {
          status: 'Accepted',
          stdout,
          stderr,
          executionTimeMs,
          exitCode: 0,
          timedOut: false,
          provider: this.name,
        };
      } catch (err: any) {
        lastError = err;
        // Continue to next mirror endpoint
      }
    }

    throw lastError || new Error('All remote compiler endpoints failed.');
  }
}

/**
 * 2. Judge0 API Provider (Optional enterprise judge provider)
 */
export class Judge0CompilerProvider implements ICompilerProvider {
  public name = 'Judge0Remote';
  private apiUrl: string;
  private apiKey?: string;

  constructor() {
    this.apiUrl = process.env.JUDGE0_URL || 'https://judge0-ce.p.rapidapi.com';
    this.apiKey = process.env.JUDGE0_API_KEY || process.env.RAPIDAPI_KEY;
  }

  public async isAvailable(): Promise<boolean> {
    return Boolean(process.env.JUDGE0_URL || this.apiKey);
  }

  public async execute(options: ExecutionOptions): Promise<ExecutionResult> {
    const startTime = Date.now();
    const timeLimitSeconds = Math.max(1, Math.ceil((options.timeLimitMs || 3000) / 1000));
    const languageId = options.language === 'c' ? 50 : 71; // 50: C (GCC 9.2.0), 71: Python (3.8.1)

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (this.apiKey) {
      headers['X-RapidAPI-Key'] = this.apiKey;
      headers['X-RapidAPI-Host'] = new URL(this.apiUrl).host;
    }

    // Submit batch or single execution in synchronous mode (?wait=true)
    const submitUrl = `${this.apiUrl}/submissions?base64_encoded=false&wait=true`;
    const response = await fetch(submitUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        source_code: options.code,
        language_id: languageId,
        stdin: options.input || '',
        cpu_time_limit: timeLimitSeconds,
        wall_time_limit: timeLimitSeconds * 2,
      }),
    });

    if (!response.ok) {
      throw new Error(`Judge0 API HTTP ${response.status}`);
    }

    const resData: any = await response.json();
    const statusId = resData.status?.id;
    const executionTimeMs = Math.round((parseFloat(resData.time) || 0) * 1000) || Date.now() - startTime;

    // Judge0 Status IDs:
    // 3: Accepted, 4: Wrong Answer, 5: Time Limit Exceeded, 6: Compilation Error, 7-12: Runtime Errors
    if (statusId === 6) {
      return {
        status: 'Compilation Error',
        stdout: resData.stdout || '',
        stderr: resData.compile_output || resData.stderr || 'Compilation error',
        executionTimeMs,
        exitCode: 1,
        timedOut: false,
        provider: this.name,
      };
    }

    if (statusId === 5) {
      return {
        status: 'Time Limit Exceeded',
        stdout: resData.stdout || '',
        stderr: 'Time Limit Exceeded',
        executionTimeMs,
        exitCode: null,
        timedOut: true,
        provider: this.name,
      };
    }

    if (statusId >= 7 && statusId <= 12) {
      return {
        status: 'Runtime Error',
        stdout: resData.stdout || '',
        stderr: resData.stderr || resData.message || 'Runtime Error',
        executionTimeMs,
        exitCode: resData.exit_code || 1,
        timedOut: false,
        provider: this.name,
      };
    }

    return {
      status: 'Accepted',
      stdout: resData.stdout || '',
      stderr: resData.stderr || '',
      executionTimeMs,
      exitCode: 0,
      timedOut: false,
      provider: this.name,
    };
  }
}

/**
 * 3. Local Compiler Provider (Uses spawn for local dev environments with gcc/python3)
 */
export class LocalCompilerProvider implements ICompilerProvider {
  public name = 'LocalSpawn';

  public async isAvailable(): Promise<boolean> {
    // In Vercel serverless functions, local execution of binaries is disabled/unavailable
    if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
      return false;
    }
    return true;
  }

  public async execute(options: ExecutionOptions): Promise<ExecutionResult> {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ddc_run_'));
    const startTime = Date.now();
    const timeLimitMs = options.timeLimitMs || 3000;

    const cleanInput =
      options.input !== undefined && options.input !== null
        ? String(options.input).replace(/\r\n/g, '\n').replace(/\r/g, '\n')
        : '';
    const finalInput = cleanInput.length > 0 && !cleanInput.endsWith('\n') ? `${cleanInput}\n` : cleanInput;

    try {
      if (options.language === 'python') {
        const scriptPath = path.join(tempDir, 'solution.py');
        fs.writeFileSync(scriptPath, options.code, 'utf8');

        return await new Promise<ExecutionResult>((resolve, reject) => {
          let stdout = '';
          let stderr = '';
          let timedOut = false;

          let proc: any;
          try {
            proc = spawn('python3', [scriptPath], {
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
          } catch (spawnErr) {
            return reject(spawnErr);
          }

          const timer = setTimeout(() => {
            timedOut = true;
            try {
              proc.kill('SIGKILL');
            } catch (_) {}
          }, timeLimitMs + 100);

          proc.stdin.on('error', () => {});

          if (finalInput) {
            try {
              proc.stdin.write(finalInput);
            } catch (_) {}
          }
          try {
            proc.stdin.end();
          } catch (_) {}

          proc.stdout.on('data', (data: any) => {
            if (stdout.length < 65536) stdout += data.toString();
          });

          proc.stderr.on('data', (data: any) => {
            if (stderr.length < 65536) stderr += data.toString();
          });

          proc.on('close', (code: number, signal: string) => {
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
                provider: this.name,
              });
            } else if (code !== 0) {
              resolve({
                status: 'Runtime Error',
                stdout,
                stderr: stderr || `Process exited with code ${code}`,
                executionTimeMs,
                exitCode: code,
                timedOut: false,
                provider: this.name,
              });
            } else {
              resolve({
                status: 'Accepted',
                stdout,
                stderr,
                executionTimeMs,
                exitCode: 0,
                timedOut: false,
                provider: this.name,
              });
            }
          });

          proc.on('error', (err: any) => {
            clearTimeout(timer);
            reject(err);
          });
        });
      } else if (options.language === 'c') {
        const sourcePath = path.join(tempDir, 'solution.c');
        const binPath = path.join(tempDir, 'solution.out');
        fs.writeFileSync(sourcePath, options.code, 'utf8');

        // Compile GCC
        const compileResult = await new Promise<{ success: boolean; stderr: string }>((resolve, reject) => {
          let stderr = '';
          let compileProc: any;
          try {
            compileProc = spawn('gcc', ['-O2', '-std=c11', sourcePath, '-o', binPath, '-lm'], {
              cwd: tempDir,
              timeout: 8000,
              env: process.env,
            });
          } catch (err) {
            return reject(err);
          }

          compileProc.stderr.on('data', (data: any) => {
            stderr += data.toString();
          });

          compileProc.on('close', (exitCode: number) => {
            resolve({ success: exitCode === 0, stderr });
          });

          compileProc.on('error', (err: any) => {
            reject(err);
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
            provider: this.name,
          };
        }

        // Execute binary
        const execStartTime = Date.now();
        return await new Promise<ExecutionResult>((resolve, reject) => {
          let stdout = '';
          let stderr = '';
          let timedOut = false;

          let proc: any;
          try {
            proc = spawn(binPath, [], {
              cwd: tempDir,
              timeout: timeLimitMs,
              env: process.env,
            });
          } catch (err) {
            return reject(err);
          }

          const timer = setTimeout(() => {
            timedOut = true;
            try {
              proc.kill('SIGKILL');
            } catch (_) {}
          }, timeLimitMs + 100);

          proc.stdin.on('error', () => {});

          if (finalInput) {
            try {
              proc.stdin.write(finalInput);
            } catch (_) {}
          }
          try {
            proc.stdin.end();
          } catch (_) {}

          proc.stdout.on('data', (data: any) => {
            if (stdout.length < 65536) stdout += data.toString();
          });

          proc.stderr.on('data', (data: any) => {
            if (stderr.length < 65536) stderr += data.toString();
          });

          proc.on('close', (code: number, signal: string) => {
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
                provider: this.name,
              });
            } else if (code !== 0) {
              resolve({
                status: 'Runtime Error',
                stdout,
                stderr: stderr || `Runtime exception (Exit code ${code})`,
                executionTimeMs,
                exitCode: code,
                timedOut: false,
                provider: this.name,
              });
            } else {
              resolve({
                status: 'Accepted',
                stdout,
                stderr,
                executionTimeMs,
                exitCode: 0,
                timedOut: false,
                provider: this.name,
              });
            }
          });

          proc.on('error', (err: any) => {
            clearTimeout(timer);
            reject(err);
          });
        });
      }

      throw new Error(`Unsupported language: ${options.language}`);
    } finally {
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch (_) {}
    }
  }
}

/**
 * 4. Composite / Master Compiler Engine
 * Automatically routes execution to the best available provider with seamless fallbacks.
 */
export class CompositeCompilerEngine {
  private providers: ICompilerProvider[] = [];

  constructor() {
    const piston = new PistonCompilerProvider();
    const judge0 = new Judge0CompilerProvider();
    const local = new LocalCompilerProvider();

    // Prefer remote when on Vercel / serverless; prefer local when in local/container environment
    if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
      this.providers = [piston, judge0];
    } else {
      this.providers = [local, piston, judge0];
    }
  }

  public async execute(options: ExecutionOptions): Promise<ExecutionResult> {
    const errors: string[] = [];

    for (const provider of this.providers) {
      try {
        const available = await provider.isAvailable();
        if (!available) continue;

        const result = await provider.execute(options);
        return result;
      } catch (err: any) {
        errors.push(`[${provider.name}]: ${err.message || err}`);
        // Fallback to next provider
      }
    }

    return {
      status: 'Runtime Error',
      stdout: '',
      stderr: `Code Execution Service Notice: All execution engines failed.\n${errors.join('\n')}`,
      executionTimeMs: 0,
      exitCode: 1,
      timedOut: false,
      provider: 'None',
    };
  }
}

export const compilerEngine = new CompositeCompilerEngine();
