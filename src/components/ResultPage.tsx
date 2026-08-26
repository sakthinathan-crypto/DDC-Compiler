import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Contest, LeaderboardEntry, Participant, Question, Submission } from '../types';
import {
  Trophy,
  Award,
  Clock,
  CheckCircle2,
  Medal,
  ArrowRight,
  RotateCcw,
  Sparkles,
  Share2,
} from 'lucide-react';

interface ResultPageProps {
  contest?: Contest | null;
  participant: Participant;
  questions: Question[];
  submissions: Submission[];
  leaderboard?: LeaderboardEntry[];
  onReviewQuestions: () => void;
  onReturnToDashboard?: () => void;
}

export const ResultPage: React.FC<ResultPageProps> = ({
  contest,
  participant,
  questions,
  submissions,
  onReviewQuestions,
  onReturnToDashboard,
}) => {
  const totalMaxMarks = contest?.totalMarks || questions.reduce((acc, q) => acc + q.marks, 0) || 50;

  useEffect(() => {
    // Launch festive confetti celebration
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (_) {}
  }, []);

  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div id="result-page" className="w-full max-w-4xl mx-auto py-8 sm:py-12 px-4 space-y-8 text-center">
      {/* Top Club Crest & Victory Title */}
      <div className="flex flex-col items-center gap-4">
        <div className="w-20 h-20 rounded-2xl bg-black/60 p-2 border border-amber-500/30 shadow-2xl flex items-center justify-center overflow-hidden">
          <img
            src="/brand/club-logo.png"
            alt="Designers Domain Club Logo"
            className="w-full h-full object-contain"
            referrerPolicy="no-referrer"
          />
        </div>

        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-mono font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{contest?.title || 'Competition'} &bull; Concluded</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight font-mono">
            🏆 COMPETITION COMPLETED
          </h1>
          <p className="text-sm font-mono text-slate-400">
            Designers Domain Club Compiler &bull; Official Submission Record
          </p>
        </div>
      </div>

      {/* Participant Identity Box */}
      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 max-w-lg mx-auto text-left">
        <div className="text-[11px] font-mono uppercase text-slate-400 font-bold">
          Participant Record
        </div>
        <div className="text-lg font-bold text-white mt-0.5">{participant.name}</div>
        <div className="text-xs text-slate-400 font-mono">
          ID: {participant.participantId} &bull; Reg: {participant.registerNumber} &bull;{' '}
          {participant.department} ({participant.year})
        </div>
      </div>

      {/* 4 Score Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 max-w-3xl mx-auto">
        {/* Card 1: Final Score */}
        <div className="p-5 rounded-2xl bg-[#0e111a] border border-amber-500/30 flex flex-col items-center justify-center space-y-1 shadow-lg shadow-amber-500/5">
          <Award className="w-6 h-6 text-amber-400" />
          <div className="text-xs font-mono uppercase text-slate-400">Final Score</div>
          <div className="text-3xl sm:text-4xl font-black font-mono text-amber-400">
            {participant.totalScore}
            <span className="text-xs text-slate-500 font-normal"> / {totalMaxMarks}</span>
          </div>
        </div>

        {/* Card 2: Solved Count */}
        <div className="p-5 rounded-2xl bg-[#0e111a] border border-emerald-500/30 flex flex-col items-center justify-center space-y-1">
          <CheckCircle2 className="w-6 h-6 text-emerald-400" />
          <div className="text-xs font-mono uppercase text-slate-400">Solved</div>
          <div className="text-3xl sm:text-4xl font-black font-mono text-emerald-400">
            {participant.solvedCount}
            <span className="text-xs text-slate-500 font-normal"> / {questions.length}</span>
          </div>
        </div>

        {/* Card 3: Completion Time */}
        <div className="p-5 rounded-2xl bg-[#0e111a] border border-sky-500/30 flex flex-col items-center justify-center space-y-1">
          <Clock className="w-6 h-6 text-sky-400" />
          <div className="text-xs font-mono uppercase text-slate-400">Time Taken</div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-sky-300">
            {formatTime(participant.completionTimeSeconds || 0)}
          </div>
        </div>

        {/* Card 4: Status */}
        <div className="p-5 rounded-2xl bg-[#0e111a] border border-purple-500/30 flex flex-col items-center justify-center space-y-1">
          <Sparkles className="w-6 h-6 text-purple-400" />
          <div className="text-xs font-mono uppercase text-slate-400">Status</div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-purple-300 uppercase">
            {participant.status === 'completed' ? 'SUBMITTED' : 'ACTIVE'}
          </div>
        </div>
      </div>

      {/* Question Performance Breakdown */}
      <div className="bg-[#0e111a] border border-slate-800 rounded-2xl p-5 max-w-3xl mx-auto text-left space-y-3">
        <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold">
          Challenge Breakdown
        </h3>
        <div className="divide-y divide-slate-800/80">
          {questions.map((q, idx) => {
            const qSubs = submissions.filter((s) => s.questionId === q.id);
            const maxScore = qSubs.length > 0 ? Math.max(...qSubs.map((s) => s.score)) : 0;
            const isSolved = maxScore >= q.marks;

            return (
              <div key={q.id} className="py-3 flex items-center justify-between gap-3 text-xs font-mono">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">#{idx + 1}</span>
                  <span className="font-bold text-white">{q.title}</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-900 text-slate-400 border border-slate-800">
                    {q.language === 'python' ? 'Python' : 'C'}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`font-bold ${
                      isSolved ? 'text-emerald-400' : maxScore > 0 ? 'text-amber-400' : 'text-slate-500'
                    }`}
                  >
                    {maxScore} / {q.marks} pts
                  </span>
                  {isSolved ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-slate-700" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
        {onReturnToDashboard && (
          <button
            onClick={onReturnToDashboard}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold font-mono text-sm shadow-md transition-all cursor-pointer"
          >
            <ArrowRight className="w-4 h-4" />
            <span>Return to Dashboard</span>
          </button>
        )}

        <button
          onClick={onReviewQuestions}
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold font-mono text-sm border border-slate-700 transition-colors cursor-pointer"
        >
          <span>Review Code Submissions</span>
        </button>
      </div>

      {/* Designed by Aegis Footer Credit */}
      <div className="pt-8 border-t border-slate-800/80 flex flex-col items-center gap-2">
        <span className="text-xs uppercase tracking-widest text-slate-400 font-semibold">
          Designed by Aegis
        </span>
        <div className="w-28 sm:w-32 h-10 flex items-center justify-center bg-black/40 rounded-lg p-1 border border-slate-800">
          <img
            src="/brand/aegis-logo.svg"
            alt="Aegis Logo"
            className="max-h-full max-w-full object-contain"
            referrerPolicy="no-referrer"
          />
        </div>
      </div>
    </div>
  );
};
