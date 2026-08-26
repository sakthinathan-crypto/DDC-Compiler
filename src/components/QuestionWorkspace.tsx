import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { Participant, Question, RunResult, Submission, SupportedLanguage } from '../types';
import { api } from '../lib/api';
import {
  ArrowLeft,
  Play,
  Send,
  RotateCcw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Terminal,
  FileCode,
  Check,
  Copy,
  Zap,
} from 'lucide-react';

interface QuestionWorkspaceProps {
  contestId: string;
  contestTitle: string;
  question: Question;
  participant: Participant;
  timeRemainingSeconds: number;
  onBack: () => void;
  onSubmitSuccess: (submission: Submission, updatedParticipant: Participant) => void;
}

export const QuestionWorkspace: React.FC<QuestionWorkspaceProps> = ({
  contestId,
  contestTitle,
  question,
  participant,
  timeRemainingSeconds,
  onBack,
  onSubmitSuccess,
}) => {
  const [code, setCode] = useState<string>(question.starterCode);
  const [activeTab, setActiveTab] = useState<'problem' | 'history'>('problem');
  const [runnerTab, setRunnerTab] = useState<'samples' | 'custom'>('samples');
  const [customInput, setCustomInput] = useState<string>('');

  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [runResult, setRunResult] = useState<RunResult | null>(null);
  const [submissionResult, setSubmissionResult] = useState<Submission | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [copiedTestId, setCopiedTestId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Load previous submissions for this question
  useEffect(() => {
    loadSubmissions();
  }, [contestId, question.id, participant.participantId]);

  const loadSubmissions = async () => {
    try {
      const subs = await api.getSubmissions(contestId, participant.participantId, question.id);
      setSubmissions(subs);
    } catch (_) {}
  };

  const handleResetCode = () => {
    if (window.confirm('Reset code to original starter buggy code?')) {
      setCode(question.starterCode);
      setRunResult(null);
      setSubmissionResult(null);
    }
  };

  const handleCopyInput = (input: string, id: string) => {
    navigator.clipboard.writeText(input);
    setCopiedTestId(id);
    setTimeout(() => setCopiedTestId(null), 2000);
  };

  // Run Code against sample test cases or custom input
  const handleRunCode = async () => {
    setErrorMsg(null);
    setIsRunning(true);
    setSubmissionResult(null);
    try {
      const res = await api.runCode({
        language: question.language,
        code,
        contestId,
        questionId: question.id,
        customInput: runnerTab === 'custom' ? customInput : undefined,
      });
      setRunResult(res);
    } catch (err: any) {
      setErrorMsg(err.message || 'Execution failed');
    } finally {
      setIsRunning(false);
    }
  };

  // Submit Solution to evaluate against Hidden Test Cases
  const handleSubmitCode = async () => {
    if (timeRemainingSeconds <= 0) {
      setErrorMsg('Contest timer has expired! No submissions allowed.');
      return;
    }

    setErrorMsg(null);
    setIsSubmitting(true);
    setRunResult(null);
    try {
      const res = await api.submitCode(contestId, {
        participantId: participant.participantId,
        questionId: question.id,
        language: question.language,
        code,
      });
      setSubmissionResult(res.submission);
      onSubmitSuccess(res.submission, res.participant);
      loadSubmissions();
    } catch (err: any) {
      setErrorMsg(err.message || 'Submission failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div id="question-workspace" className="w-full flex flex-col h-[calc(100vh-60px)] overflow-hidden bg-[#0a0c12]">
      {/* Workspace Top Toolbar */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-2 bg-[#0e111a] border-b border-slate-800 gap-3">
        {/* Left: Back & Question Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Challenges</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="font-bold text-white text-sm sm:text-base font-mono">
              Q{question.orderNumber}. {question.title}
            </span>
            <span
              className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold uppercase border ${
                question.language === 'python'
                  ? 'bg-sky-500/10 text-sky-400 border-sky-500/20'
                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              }`}
            >
              {question.language === 'python' ? 'Python 3' : 'C (GCC)'}
            </span>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
              {question.marks} pts
            </span>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleResetCode}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            title="Reset to Buggy Starter Code"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Reset Buggy Code</span>
          </button>

          <button
            id="run-code-btn"
            onClick={handleRunCode}
            disabled={isRunning || isSubmitting}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 disabled:opacity-50 text-slate-200 hover:text-white border border-slate-700 text-xs font-bold font-mono transition-all cursor-pointer"
          >
            <Play className={`w-3.5 h-3.5 text-sky-400 ${isRunning ? 'animate-spin' : ''}`} />
            <span>{isRunning ? 'Running...' : 'Run Code'}</span>
          </button>

          <button
            id="submit-solution-btn"
            onClick={handleSubmitCode}
            disabled={isRunning || isSubmitting || timeRemainingSeconds <= 0}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 text-xs font-bold font-mono shadow-md shadow-amber-500/10 transition-all cursor-pointer"
          >
            <Send className={`w-3.5 h-3.5 ${isSubmitting ? 'animate-bounce' : ''}`} />
            <span>{isSubmitting ? 'Evaluating...' : 'Submit Solution'}</span>
          </button>
        </div>
      </div>

      {/* Main Split Layout: Left (Problem Specs) & Right (Code Editor + Console) */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        {/* LEFT PANE: 5 Columns (Problem Description, Constraints, Test Cases, Submissions) */}
        <div className="lg:col-span-5 flex flex-col h-full border-r border-slate-800 bg-[#0d1017] overflow-hidden text-left">
          {/* Left Tab Switcher */}
          <div className="flex-shrink-0 flex border-b border-slate-800 bg-[#0b0e14] px-4 pt-2 gap-2 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('problem')}
              className={`pb-2 px-2 border-b-2 transition-colors ${
                activeTab === 'problem'
                  ? 'border-amber-400 text-amber-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Problem Description
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`pb-2 px-2 border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === 'history'
                  ? 'border-amber-400 text-amber-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>Submissions</span>
              {submissions.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-slate-300">
                  {submissions.length}
                </span>
              )}
            </button>
          </div>

          {/* Left Tab Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6 text-sm text-slate-300 leading-relaxed">
            {activeTab === 'problem' ? (
              <>
                {/* Statement */}
                <div className="space-y-2">
                  <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold">
                    Problem Statement
                  </h3>
                  <div className="whitespace-pre-line text-slate-200 text-sm">
                    {question.problemStatement}
                  </div>
                </div>

                {/* Bug Notice Box */}
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 space-y-1">
                  <div className="font-bold flex items-center gap-1.5 font-mono">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span>Debugging Objective</span>
                  </div>
                  <p className="text-amber-200/90 leading-normal">
                    This challenge contains an intentional bug. Locate the flaw in the editor on the right, fix the logic, and verify against all test cases.
                  </p>
                </div>

                {/* Input Format */}
                <div className="space-y-1.5">
                  <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold">
                    Input Format
                  </h3>
                  <div className="p-3 bg-slate-900/90 rounded-lg border border-slate-800 font-mono text-xs text-slate-200 whitespace-pre-line">
                    {question.inputFormat}
                  </div>
                </div>

                {/* Output Format */}
                <div className="space-y-1.5">
                  <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold">
                    Output Format
                  </h3>
                  <div className="p-3 bg-slate-900/90 rounded-lg border border-slate-800 font-mono text-xs text-slate-200 whitespace-pre-line">
                    {question.outputFormat}
                  </div>
                </div>

                {/* Constraints */}
                <div className="space-y-1.5">
                  <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold">
                    Constraints
                  </h3>
                  <div className="p-3 bg-slate-900/90 rounded-lg border border-slate-800 font-mono text-xs text-amber-300/90 whitespace-pre-line">
                    {question.constraints}
                  </div>
                </div>

                {/* Sample Test Cases */}
                <div className="space-y-3">
                  <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold">
                    Sample Test Cases
                  </h3>
                  {question.sampleTestCases.map((tc, idx) => (
                    <div
                      key={tc.id}
                      className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2.5"
                    >
                      <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-400">
                        <span>Sample {idx + 1}</span>
                        <button
                          onClick={() => handleCopyInput(tc.input, tc.id)}
                          className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-amber-400 transition-colors"
                        >
                          {copiedTestId === tc.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span className="text-emerald-400">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy Input</span>
                            </>
                          )}
                        </button>
                      </div>

                      <div className="space-y-1">
                        <div className="text-[11px] font-mono text-slate-400">Input:</div>
                        <pre className="p-2 rounded bg-black/60 font-mono text-xs text-emerald-300 overflow-x-auto">
                          {tc.input}
                        </pre>
                      </div>

                      <div className="space-y-1">
                        <div className="text-[11px] font-mono text-slate-400">Expected Output:</div>
                        <pre className="p-2 rounded bg-black/60 font-mono text-xs text-sky-300 overflow-x-auto">
                          {tc.expectedOutput}
                        </pre>
                      </div>

                      {tc.explanation && (
                        <div className="text-xs text-slate-400 italic pt-1 border-t border-slate-800/60">
                          <span className="font-semibold text-slate-300">Explanation:</span>{' '}
                          {tc.explanation}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              /* Submissions History */
              <div className="space-y-3">
                <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold">
                  Submission Logs
                </h3>
                {submissions.length === 0 ? (
                  <div className="p-6 text-center text-slate-500 font-mono text-xs">
                    No submissions recorded yet for this challenge.
                  </div>
                ) : (
                  submissions.map((sub) => {
                    const isAccepted = sub.status === 'Accepted';
                    return (
                      <div
                        key={sub.id}
                        className={`p-3.5 rounded-xl border space-y-2 text-xs font-mono ${
                          isAccepted
                            ? 'bg-emerald-950/20 border-emerald-500/40'
                            : 'bg-slate-900/80 border-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            {isAccepted ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <XCircle className="w-4 h-4 text-rose-400" />
                            )}
                            <span
                              className={`font-bold ${
                                isAccepted ? 'text-emerald-400' : 'text-rose-400'
                              }`}
                            >
                              {sub.status}
                            </span>
                          </div>
                          <span className="font-bold text-amber-400">
                            {sub.score}/{question.marks} pts
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-slate-400 text-[11px]">
                          <span>
                            Tests: {sub.testsPassed}/{sub.totalTests} passed
                          </span>
                          <span>Time: {sub.executionTimeMs}ms</span>
                        </div>

                        <div className="text-[10px] text-slate-500">
                          {new Date(sub.submittedAt).toLocaleTimeString()}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANE: 7 Columns (Monaco Code Editor + Interactive Console) */}
        <div className="lg:col-span-7 flex flex-col h-full bg-[#0a0c12] overflow-hidden text-left">
          {/* Editor Header Bar */}
          <div className="flex-shrink-0 flex items-center justify-between px-4 py-2 bg-[#0c0f17] border-b border-slate-800 text-xs font-mono text-slate-400">
            <div className="flex items-center gap-2">
              <FileCode className="w-3.5 h-3.5 text-amber-400" />
              <span>
                solution.{question.language === 'python' ? 'py' : 'c'} (Loaded with Buggy Code)
              </span>
            </div>
            <span className="text-[11px] text-slate-500">Monaco IDE &bull; GCC / Python 3</span>
          </div>

          {/* Monaco Editor Component */}
          <div className="flex-1 min-h-[260px] relative">
            <Editor
              height="100%"
              language={question.language === 'python' ? 'python' : 'c'}
              value={code}
              theme="vs-dark"
              onChange={(value) => setCode(value || '')}
              options={{
                fontSize: 13,
                fontFamily: "'Fira Code', 'JetBrains Mono', 'Consolas', monospace",
                lineNumbers: 'on',
                roundedSelection: true,
                scrollBeyondLastLine: false,
                readOnly: false,
                automaticLayout: true,
                tabSize: 4,
                minimap: { enabled: false },
                wordWrap: 'on',
                bracketPairColorization: { enabled: true },
                autoIndent: 'full',
              }}
            />
          </div>

          {/* Bottom Execution Console & Testing Tray */}
          <div className="flex-shrink-0 h-64 lg:h-72 border-t border-slate-800 bg-[#0c0f17] flex flex-col overflow-hidden">
            {/* Console Tabs */}
            <div className="flex-shrink-0 flex items-center justify-between px-3 pt-1.5 bg-[#090b10] border-b border-slate-800 text-xs font-mono">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setRunnerTab('samples')}
                  className={`px-3 py-1.5 rounded-t-lg transition-colors ${
                    runnerTab === 'samples'
                      ? 'bg-[#0c0f17] text-amber-400 font-bold border-t-2 border-amber-400'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Sample Tests Result
                </button>
                <button
                  onClick={() => setRunnerTab('custom')}
                  className={`px-3 py-1.5 rounded-t-lg transition-colors ${
                    runnerTab === 'custom'
                      ? 'bg-[#0c0f17] text-amber-400 font-bold border-t-2 border-amber-400'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Custom Testcase
                </button>
              </div>

              {/* Status Indicator */}
              <div className="flex items-center gap-2 pr-2">
                {submissionResult && (
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      submissionResult.status === 'Accepted'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    }`}
                  >
                    Submission: {submissionResult.status} ({submissionResult.score}/{question.marks} pts)
                  </span>
                )}
                {runResult && !submissionResult && (
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      runResult.status === 'Accepted'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    Run: {runResult.status} ({runResult.passedCount}/{runResult.totalCount} passed)
                  </span>
                )}
              </div>
            </div>

            {/* Console Body */}
            <div className="flex-1 overflow-y-auto p-3 text-xs font-mono text-slate-300">
              {errorMsg && (
                <div className="p-3 mb-2 rounded bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {runnerTab === 'custom' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 h-full">
                  <div className="flex flex-col space-y-1">
                    <label className="text-[11px] text-slate-400 font-bold">Custom Input (stdin):</label>
                    <textarea
                      value={customInput}
                      onChange={(e) => setCustomInput(e.target.value)}
                      placeholder="Enter custom input lines here..."
                      className="flex-1 min-h-[100px] p-2 bg-black/60 border border-slate-800 rounded font-mono text-xs text-white outline-none focus:border-amber-500 resize-none"
                    />
                  </div>

                  <div className="flex flex-col space-y-1">
                    <label className="text-[11px] text-slate-400 font-bold">Execution Output:</label>
                    <pre className="flex-1 min-h-[100px] p-2 bg-black/60 border border-slate-800 rounded font-mono text-xs text-sky-300 overflow-y-auto whitespace-pre-wrap">
                      {runResult?.output || (runResult?.error ? runResult.error : 'Click "Run Code" to test against custom input.')}
                    </pre>
                  </div>
                </div>
              ) : (
                /* Sample / Submission Results breakdown */
                <div className="space-y-3">
                  {/* If Submission result available */}
                  {submissionResult && (
                    <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                        <div className="flex items-center gap-2">
                          {submissionResult.status === 'Accepted' ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                          ) : (
                            <XCircle className="w-5 h-5 text-rose-400" />
                          )}
                          <span className="font-bold text-sm text-white">
                            Official Submission Result: {submissionResult.status}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-bold text-amber-400">
                            {submissionResult.score} / {question.marks} Marks
                          </span>
                        </div>
                      </div>

                      {/* Compiler error if any */}
                      {submissionResult.compilerOutput && (
                        <div className="p-2.5 rounded bg-rose-950/30 border border-rose-500/30 text-rose-300 whitespace-pre-wrap">
                          <div className="font-bold mb-1">Compiler Error:</div>
                          {submissionResult.compilerOutput}
                        </div>
                      )}

                      {/* Evaluation Grid (Samples + Hidden) */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {submissionResult.testResults?.map((tr, idx) => (
                          <div
                            key={idx}
                            className={`p-2 rounded border flex items-center justify-between text-xs ${
                              tr.passed
                                ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                                : 'bg-rose-950/20 border-rose-500/30 text-rose-300'
                            }`}
                          >
                            <span>
                              {tr.isSample ? `Sample ${tr.testNumber}` : `Hidden #${tr.testNumber}`}
                            </span>
                            {tr.passed ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <XCircle className="w-3.5 h-3.5 text-rose-400" />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* If Run result available */}
                  {runResult && !submissionResult && (
                    <div className="space-y-2.5">
                      {runResult.compilerOutput && (
                        <div className="p-2.5 rounded bg-rose-950/30 border border-rose-500/30 text-rose-300 whitespace-pre-wrap">
                          <div className="font-bold mb-1">Compiler Error / Warning:</div>
                          {runResult.compilerOutput}
                        </div>
                      )}

                      {runResult.testResults.map((tr, idx) => (
                        <div
                          key={idx}
                          className={`p-3 rounded-lg border space-y-1.5 ${
                            tr.passed
                              ? 'bg-emerald-950/15 border-emerald-500/30'
                              : 'bg-rose-950/15 border-rose-500/30'
                          }`}
                        >
                          <div className="flex items-center justify-between font-bold">
                            <span className={tr.passed ? 'text-emerald-400' : 'text-rose-400'}>
                              Sample Test {tr.testNumber}: {tr.passed ? 'PASSED ✓' : 'FAILED ✗'}
                            </span>
                            <span className="text-slate-400 text-[11px]">{tr.executionTimeMs}ms</span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
                            <div>
                              <span className="text-slate-500">Your Output:</span>
                              <pre className="p-1.5 rounded bg-black/60 text-slate-200 overflow-x-auto whitespace-pre-wrap">
                                {tr.actual || tr.error || '<No output>'}
                              </pre>
                            </div>
                            <div>
                              <span className="text-slate-500">Expected Output:</span>
                              <pre className="p-1.5 rounded bg-black/60 text-slate-200 overflow-x-auto whitespace-pre-wrap">
                                {tr.expected}
                              </pre>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {!runResult && !submissionResult && (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
                      <Terminal className="w-6 h-6 mb-2 opacity-50 text-slate-400" />
                      <p>Click "Run Code" to test against sample test cases.</p>
                      <p className="text-[11px] text-slate-600 mt-1">
                        When ready, click "Submit Solution" to evaluate against hidden test cases.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
