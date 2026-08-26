import React from 'react';
import { Contest, Participant, Question, Submission } from '../types';
import {
  Code2,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  Trophy,
  Flame,
  Award,
  Terminal,
  FileCode,
  ChevronLeft,
} from 'lucide-react';

interface CompetitionDashboardProps {
  contest: Contest;
  participant: Participant;
  questions: Question[];
  submissions: Submission[];
  timeRemainingSeconds: number;
  onSelectQuestion: (questionId: string) => void;
  onFinishCompetition: () => void;
  onBackToCatalog?: () => void;
}

export const CompetitionDashboard: React.FC<CompetitionDashboardProps> = ({
  contest,
  participant,
  questions,
  submissions,
  timeRemainingSeconds,
  onSelectQuestion,
  onFinishCompetition,
  onBackToCatalog,
}) => {
  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const totalMaxMarks = contest.totalMarks || questions.reduce((acc, q) => acc + q.marks, 0) || 50;

  // Helper to determine per-question status
  const getQuestionStatus = (questionId: string) => {
    const qSubs = submissions.filter((s) => s.questionId === questionId);
    const targetQ = questions.find((q) => q.id === questionId);
    const maxPossible = targetQ ? targetQ.marks : 10;

    if (qSubs.length === 0) return { label: 'Unsolved', status: 'unsolved', score: 0 };
    const maxScore = Math.max(...qSubs.map((s) => s.score));

    if (maxScore >= maxPossible) {
      return { label: `Accepted (${maxPossible}/${maxPossible})`, status: 'accepted', score: maxScore };
    }
    if (maxScore > 0) {
      return { label: `Partial (${maxScore}/${maxPossible})`, status: 'partial', score: maxScore };
    }
    return { label: `Attempted (0/${maxPossible})`, status: 'attempted', score: 0 };
  };

  const isTimeCritical = timeRemainingSeconds > 0 && timeRemainingSeconds < 300;

  return (
    <div id="competition-dashboard" className="w-full max-w-6xl mx-auto py-6 px-4 space-y-6">
      {/* Top breadcrumb to catalog */}
      {onBackToCatalog && (
        <div className="flex items-center justify-between">
          <button
            onClick={onBackToCatalog}
            className="flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Browse All Contests</span>
          </button>
          <span className="text-xs font-mono text-amber-400 font-semibold">{contest.title}</span>
        </div>
      )}

      {/* Participant Overview Card */}
      <div className="bg-[#0e111a] border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
          {/* Col 1: Participant Identity */}
          <div className="md:col-span-2 space-y-1 text-left">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-[11px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded">
                PARTICIPANT
              </span>
              <span className="text-xs font-mono text-slate-400">ID: {participant.participantId}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              {participant.name}
            </h2>
            <p className="text-xs text-slate-400 font-sans">
              {participant.department} &bull; {participant.year}
            </p>
          </div>

          {/* Col 2: Score & Solved Count */}
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                Current Score
              </div>
              <div className="text-2xl font-black font-mono text-amber-400">
                {participant.totalScore}{' '}
                <span className="text-xs font-normal text-slate-500">/ {totalMaxMarks}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                Solved
              </div>
              <div className="text-lg font-bold font-mono text-emerald-400">
                {participant.solvedCount} / {questions.length}
              </div>
            </div>
          </div>

          {/* Col 3: Time Remaining Pill */}
          <div
            className={`p-3.5 rounded-xl border flex flex-col justify-between ${
              isTimeCritical
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                : 'bg-slate-900/80 border-slate-800 text-amber-300'
            }`}
          >
            <div className="flex items-center justify-between text-[11px] font-mono uppercase">
              <span>Time Remaining</span>
              <Clock className="w-3.5 h-3.5" />
            </div>
            <div className="text-2xl font-black font-mono tracking-wider">
              {timeRemainingSeconds > 0 ? formatTime(timeRemainingSeconds) : '00:00'}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="w-full sm:flex-1">
            <div className="flex justify-between text-xs font-mono text-slate-400 mb-1.5">
              <span>Contest Progress</span>
              <span>{Math.round((participant.totalScore / (totalMaxMarks || 1)) * 100)}% Completed</span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (participant.totalScore / (totalMaxMarks || 1)) * 100)}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={onFinishCompetition}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition-all shadow-md shadow-amber-950/40 cursor-pointer"
            >
              Finish & View Result
            </button>
          </div>
        </div>
      </div>

      {/* Questions Header */}
      <div className="flex items-center justify-between text-left">
        <div>
          <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <span>Contest Challenges</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-slate-800 text-slate-300 border border-slate-700">
              {questions.length} Questions
            </span>
          </h3>
          <p className="text-xs text-slate-400">
            Select any challenge below. Identify the bug, fix the logic, and submit for evaluation.
          </p>
        </div>
      </div>

      {/* Questions Grid or Empty State */}
      {questions.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-[#0e111a] border border-slate-800 space-y-2">
          <Terminal className="w-8 h-8 text-slate-500 mx-auto" />
          <div className="text-sm font-mono text-slate-300 font-bold">No questions available</div>
          <p className="text-xs text-slate-500">
            This competition does not have any active questions assigned yet.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {questions.map((q, idx) => {
            const qStatus = getQuestionStatus(q.id);
            const isAccepted = qStatus.status === 'accepted';
            const isPartial = qStatus.status === 'partial';

            return (
              <div
                key={q.id}
                onClick={() => onSelectQuestion(q.id)}
                className={`group relative p-5 rounded-2xl bg-[#0e111a] border transition-all cursor-pointer flex flex-col justify-between gap-4 hover:scale-[1.01] hover:shadow-xl text-left ${
                  isAccepted
                    ? 'border-emerald-500/40 bg-emerald-950/10'
                    : isPartial
                    ? 'border-amber-500/40 bg-amber-950/10'
                    : 'border-slate-800 hover:border-amber-500/40'
                }`}
              >
                {/* Question Header & Language */}
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <span className="text-xs font-mono font-bold text-slate-400">
                      Challenge {idx + 1}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold uppercase border ${
                          q.language === 'python'
                            ? 'bg-sky-500/10 text-sky-400 border-sky-500/20'
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        }`}
                      >
                        {q.language === 'python' ? 'Python 3' : 'C (GCC)'}
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[11px] font-mono font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        {q.marks} pts
                      </span>
                    </div>
                  </div>

                  <h4 className="text-base font-bold text-white group-hover:text-amber-400 transition-colors">
                    {q.title}
                  </h4>

                  <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {q.description}
                  </p>
                </div>

                {/* Card Footer: Status & Action */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <div>
                    {isAccepted ? (
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 font-mono">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{qStatus.label}</span>
                      </div>
                    ) : isPartial ? (
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400 font-mono">
                        <Award className="w-4 h-4" />
                        <span>{qStatus.label}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono">
                        <FileCode className="w-3.5 h-3.5" />
                        <span>{qStatus.label}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1 text-xs font-semibold text-amber-400 group-hover:translate-x-0.5 transition-transform">
                    <span>{isAccepted ? 'Review' : 'Debug'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
