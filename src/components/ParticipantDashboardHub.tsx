import React, { useEffect, useState } from 'react';
import { Contest, ParticipantAccount, ParticipantResult } from '../types';
import { api } from '../lib/api';
import {
  Trophy,
  Award,
  Play,
  Clock,
  CheckCircle2,
  AlertCircle,
  Layers,
  Sparkles,
  ChevronRight,
  User,
  Zap,
  Timer,
  BarChart3,
  Flame,
  ArrowUpRight,
  BookOpen,
  LogOut,
} from 'lucide-react';

interface ParticipantDashboardHubProps {
  account: ParticipantAccount;
  contests: Contest[];
  onEnterContest: (contest: Contest) => void;
  onViewResults: () => void;
  onViewProfile: () => void;
  onViewRules: (contest?: Contest) => void;
  onLogout?: () => void;
}

export const ParticipantDashboardHub: React.FC<ParticipantDashboardHubProps> = ({
  account,
  contests,
  onEnterContest,
  onViewResults,
  onViewProfile,
  onViewRules,
  onLogout,
}) => {
  const [results, setResults] = useState<ParticipantResult[]>([]);
  const [loadingResults, setLoadingResults] = useState(true);

  useEffect(() => {
    loadResults();
  }, [account.participantId]);

  const loadResults = async () => {
    try {
      setLoadingResults(true);
      const data = await api.getParticipantResults(account.participantId);
      setResults(data);
    } catch (_) {
    } finally {
      setLoadingResults(false);
    }
  };

  const activeContests = contests.filter((c) => c.status === 'active');
  const upcomingContests = contests.filter((c) => c.status === 'upcoming');
  const completedContests = contests.filter((c) => c.status === 'completed');

  const totalPoints = results.reduce((sum, r) => sum + r.totalScore, 0);
  const totalSolved = results.reduce((sum, r) => sum + r.solvedCount, 0);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Welcome Banner */}
      <div className="relative rounded-3xl bg-gradient-to-r from-[#121624] via-[#0d1017] to-[#121624] border border-amber-500/30 p-6 sm:p-8 shadow-2xl overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                PARTICIPANT COMPILER HUB
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Session
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight font-sans">
              Welcome, {account.name}
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 flex flex-wrap items-center gap-2">
              <span className="font-mono text-amber-400">{account.participantId}</span>
              <span>•</span>
              <span>{account.department}</span>
              <span>•</span>
              <span>{account.year}</span>
              <span>•</span>
              <span className="text-slate-400">{account.college}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onViewProfile}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
            >
              <User className="w-3.5 h-3.5 text-amber-400" />
              Edit Profile
            </button>
            <button
              onClick={onViewResults}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition-all shadow-lg shadow-amber-950/40 cursor-pointer"
            >
              <Award className="w-3.5 h-3.5" />
              My Contest Results
            </button>
            {onLogout && (
              <button
                id="dashboard-logout-btn"
                onClick={onLogout}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 hover:text-rose-200 text-xs font-semibold border border-rose-500/30 transition-colors cursor-pointer"
                title="Log Out of Account"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Quick Overview Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-[#0e1118]/80 backdrop-blur-xl border border-amber-500/20 p-5 shadow-lg flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Total Points</div>
            <div className="text-2xl font-bold text-white font-mono">{totalPoints} pts</div>
          </div>
        </div>

        <div className="rounded-2xl bg-[#0e1118]/80 backdrop-blur-xl border border-slate-800 p-5 shadow-lg flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Bugs Solved</div>
            <div className="text-2xl font-bold text-white font-mono">{totalSolved} Problems</div>
          </div>
        </div>

        <div className="rounded-2xl bg-[#0e1118]/80 backdrop-blur-xl border border-slate-800 p-5 shadow-lg flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
            <Flame className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Live Contests</div>
            <div className="text-2xl font-bold text-white font-mono">{activeContests.length} Available</div>
          </div>
        </div>

        <div className="rounded-2xl bg-[#0e1118]/80 backdrop-blur-xl border border-slate-800 p-5 shadow-lg flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Contests Entered</div>
            <div className="text-2xl font-bold text-white font-mono">{results.length} Events</div>
          </div>
        </div>
      </div>

      {/* Live & Active Contests Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              Active Competitions
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Select any live competition to enter the Monaco coding workspace and begin solving.
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            {activeContests.length} Live
          </span>
        </div>

        {activeContests.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-[#0e1118]/60 border border-slate-800">
            <Clock className="w-8 h-8 text-slate-500 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-300">No competitions active right now</p>
            <p className="text-xs text-slate-500 mt-1">Check back shortly or view upcoming scheduled events.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {activeContests.map((contest) => {
              const existingResult = results.find((r) => r.contestId === contest.id);

              return (
                <div
                  key={contest.id}
                  className="rounded-2xl bg-[#0e1118]/90 backdrop-blur-xl border border-amber-500/30 hover:border-amber-500/60 p-6 shadow-xl flex flex-col justify-between transition-all group"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        LIVE
                      </span>
                      <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        {contest.durationMinutes} Minutes
                      </span>
                    </div>

                    <div>
                      <h3 className="text-xl font-bold text-white group-hover:text-amber-400 transition-colors font-mono">
                        {contest.title}
                      </h3>
                      {contest.tagline && (
                        <p className="text-xs text-amber-400/90 font-medium mt-0.5">
                          {contest.tagline}
                        </p>
                      )}
                    </div>

                    <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                      {contest.description}
                    </p>

                    <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
                      <span>
                        Questions: <strong className="text-white">{contest.totalQuestions || 5}</strong>
                      </span>
                      <span>
                        Max Score:{' '}
                        <strong className="text-amber-400">{contest.totalMarks || 50} pts</strong>
                      </span>
                      {existingResult && (
                        <span className="text-emerald-400 font-semibold">
                          Score: {existingResult.totalScore} pts
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="pt-5 mt-4 border-t border-slate-800/80 flex items-center gap-3">
                    <button
                      onClick={() => onEnterContest(contest)}
                      className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold text-xs tracking-wider uppercase transition-all shadow-md shadow-amber-950/40 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>{existingResult ? 'Resume Workspace' : 'Enter Competition'}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Upcoming & Completed Contests if available */}
      {upcomingContests.length > 0 && (
        <div className="space-y-4 pt-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
            <Clock className="w-4 h-4 text-sky-400" />
            Upcoming Competitions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {upcomingContests.map((c) => (
              <div
                key={c.id}
                className="rounded-2xl bg-[#0e1118]/60 border border-slate-800 p-5 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20">
                      UPCOMING
                    </span>
                    <span className="text-xs text-slate-400 font-mono">{c.durationMinutes} mins</span>
                  </div>
                  <h3 className="text-base font-bold text-white">{c.title}</h3>
                  <p className="text-xs text-slate-400 line-clamp-2">{c.description}</p>
                </div>
                <div className="pt-3 mt-3 border-t border-slate-800 flex items-center justify-between">
                  <button
                    onClick={() => onViewRules(c)}
                    className="text-xs text-slate-400 hover:text-amber-400 flex items-center gap-1 font-mono"
                  >
                    <BookOpen className="w-3 h-3" /> View Guidelines
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
