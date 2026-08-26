import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { ParticipantAccount, ParticipantResult } from '../types';
import {
  Trophy,
  Award,
  Clock,
  CheckCircle2,
  AlertCircle,
  Layers,
  ChevronRight,
  Sparkles,
  ExternalLink,
  Timer,
  BarChart3,
} from 'lucide-react';

interface MyResultsViewProps {
  account: ParticipantAccount;
  onSelectContestLeaderboard: (contestId: string) => void;
  onEnterContest: (contestId: string) => void;
  onBrowseContests: () => void;
}

export const MyResultsView: React.FC<MyResultsViewProps> = ({
  account,
  onSelectContestLeaderboard,
  onEnterContest,
  onBrowseContests,
}) => {
  const [results, setResults] = useState<ParticipantResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadResults();
  }, [account.participantId]);

  const loadResults = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getParticipantResults(account.participantId);
      setResults(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load contest results');
    } finally {
      setLoading(false);
    }
  };

  const totalPointsEarned = results.reduce((sum, r) => sum + r.totalScore, 0);
  const totalSolvedBugs = results.reduce((sum, r) => sum + r.solvedCount, 0);
  const completedContests = results.filter((r) => r.status === 'completed').length;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-sans">
              My Competition Results
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-amber-500/10 border border-amber-500/30 text-amber-400">
              {account.participantId}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Official performance records and leaderboard achievements across all contests.
          </p>
        </div>

        <button
          onClick={onBrowseContests}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition-colors cursor-pointer"
        >
          <Layers className="w-4 h-4" />
          Browse Active Contests
        </button>
      </div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="rounded-2xl bg-[#0e1118]/80 backdrop-blur-xl border border-amber-500/20 p-5 shadow-lg flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium">Total Score</span>
            <div className="text-2xl font-bold text-white font-mono">{totalPointsEarned} pts</div>
          </div>
        </div>

        <div className="rounded-2xl bg-[#0e1118]/80 backdrop-blur-xl border border-slate-800 p-5 shadow-lg flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium">Solved Challenges</span>
            <div className="text-2xl font-bold text-white font-mono">{totalSolvedBugs} Problems</div>
          </div>
        </div>

        <div className="rounded-2xl bg-[#0e1118]/80 backdrop-blur-xl border border-slate-800 p-5 shadow-lg flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium">Contests Participated</span>
            <div className="text-2xl font-bold text-white font-mono">{results.length} Events</div>
          </div>
        </div>
      </div>

      {/* Results List */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-400">Loading your competition records...</p>
        </div>
      ) : error ? (
        <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-200 text-sm text-center">
          <AlertCircle className="w-6 h-6 text-rose-400 mx-auto mb-2" />
          <p>{error}</p>
          <button
            onClick={loadResults}
            className="mt-3 px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white"
          >
            Retry
          </button>
        </div>
      ) : results.length === 0 ? (
        <div className="py-16 text-center rounded-2xl bg-[#0e1118]/60 border border-slate-800/80 p-8">
          <div className="w-14 h-14 rounded-2xl bg-slate-800/60 border border-slate-700/80 flex items-center justify-center text-slate-400 mx-auto mb-4">
            <Trophy className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-white mb-1">No Contest Participations Yet</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mb-6">
            You haven't participated in any coding competitions yet. Enter one of the live contests to start building your competition record!
          </p>
          <button
            onClick={onBrowseContests}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition-all shadow-lg shadow-amber-950/40"
          >
            <Sparkles className="w-4 h-4" />
            ENTER A LIVE CONTEST
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {results.map((res) => {
            const isRank1 = res.rank === 1;
            const isRank2 = res.rank === 2;
            const isRank3 = res.rank === 3;

            return (
              <div
                key={res.contestId}
                className={`rounded-2xl bg-[#0e1118]/80 backdrop-blur-xl border transition-all p-6 ${
                  isRank1
                    ? 'border-amber-500/40 shadow-xl shadow-amber-950/20'
                    : 'border-slate-800/90 hover:border-slate-700'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  {/* Contest Title & Badges */}
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-bold text-white">{res.contestTitle}</h2>
                      {res.status === 'completed' ? (
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Completed
                        </span>
                      ) : res.status === 'active' ? (
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1 animate-pulse">
                          <Timer className="w-3 h-3" /> In Progress
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30">
                          Disqualified
                        </span>
                      )}

                      {res.rank > 0 && (
                        <span
                          className={`px-2.5 py-0.5 rounded text-[11px] font-bold font-mono flex items-center gap-1 ${
                            isRank1
                              ? 'bg-amber-400 text-black font-extrabold shadow-sm'
                              : isRank2
                              ? 'bg-slate-300 text-black'
                              : isRank3
                              ? 'bg-amber-700 text-white'
                              : 'bg-slate-800 text-slate-300 border border-slate-700'
                          }`}
                        >
                          <Trophy className="w-3 h-3" />
                          Rank #{res.rank}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                      <span className="flex items-center gap-1.5 font-mono">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        Time Taken: <strong className="text-slate-200">{res.timeDisplay}</strong>
                      </span>
                      <span>•</span>
                      <span>
                        Problems Solved:{' '}
                        <strong className="text-amber-400">
                          {res.solvedCount} / {res.totalQuestions}
                        </strong>
                      </span>
                      <span>•</span>
                      <span>
                        Total Score:{' '}
                        <strong className="text-emerald-400 font-mono">
                          {res.totalScore} / {res.totalMarks} pts
                        </strong>
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => onSelectContestLeaderboard(res.contestId)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
                    >
                      <BarChart3 className="w-3.5 h-3.5 text-amber-400" />
                      Leaderboard
                    </button>

                    <button
                      onClick={() => onEnterContest(res.contestId)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition-all shadow-md shadow-amber-950/30 cursor-pointer"
                    >
                      {res.status === 'completed' ? 'Review Workspace' : 'Continue Contest'}
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
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
