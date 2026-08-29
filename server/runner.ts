import { SupportedLanguage, SubmissionStatus } from '../src/types';
import { compilerEngine, ExecutionResult } from './compilerProvider';

export type { ExecutionResult };

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

  // 2. Boolean case-insensitivity (e.g. Python "True" vs expected "true" or "Valid" vs "valid")
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

/**
 * Executes a single test case using the robust Compiler Engine (Piston / Judge0 / Local).
 */
export async function executeSingle(
  language: SupportedLanguage,
  code: string,
  input: string,
  timeLimitMs: number = 3000
): Promise<ExecutionResult> {
  return await compilerEngine.execute({
    language,
    code,
    input,
    timeLimitMs,
  });
}

