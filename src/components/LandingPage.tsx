import React, { useState } from 'react';
import { Contest, ParticipantAccount } from '../types';
import {
  Trophy,
  Code2,
  Clock,
  CheckCircle,
  ArrowRight,
  ShieldCheck,
  Terminal,
  Search,
  Filter,
  Flame,
  Calendar,
  Users,
  Sparkles,
  Zap,
  LogIn,
  UserPlus,
  BookOpen,
} from 'lucide-react';

interface LandingPageProps {
  contests: Contest[];
  account?: ParticipantAccount | null;
  onEnterContest: (contest: Contest) => void;
  onViewRules: (contest?: Contest) => void;
  onNavigateToLogin: () => void;
  onNavigateToSignUp: () => void;
  onNavigateToDashboard?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  contests,
  account,
  onEnterContest,
  onViewRules,
  onNavigateToLogin,
  onNavigateToSignUp,
  onNavigateToDashboard,
}) => {
  const [filterTab, setFilterTab] = useState<'all' | 'active' | 'upcoming' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const featuredContest =
    contests.find((c) => c.id === 'breach-the-bug-round-2') ||
    contests.find((c) => c.id === 'breach-the-bug-round-3') ||
    contests.find((c) => c.status === 'active') ||
    contests[0];

  const filteredContests = contests.filter((c) => {
    const matchesTab =
      filterTab === 'all' ||
      (filterTab === 'active' && c.status === 'active') ||
      (filterTab === 'upcoming' && c.status === 'upcoming') ||
      (filterTab === 'completed' && c.status === 'completed');

    const matchesSearch =
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.tagline && c.tagline.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesTab && matchesSearch;
  });

  return (
    <div id="landing-page" className="w-full flex flex-col items-center justify-center py-6 sm:py-12 px-4">
      <div className="max-w-6xl mx-auto w-full space-y-12">
        {/* Top Organization Header & Platform Identity */}
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="relative group">
            <div className="absolute -inset-4 bg-amber-500/10 rounded-full blur-xl group-hover:bg-amber-500/20 transition-all" />
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 bg-black/60 rounded-2xl p-2 border border-amber-500/30 shadow-2xl flex items-center justify-center backdrop-blur-md overflow-hidden">
              <img
                src="/brand/club-logo.png"
                alt="Designers Domain Club Logo"
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>

          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-slate-900 border border-amber-500/30 text-xs font-mono font-medium text-amber-400">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              Designers Domain Club &bull; Official Compiler Platform
            </div>

            <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-white font-mono uppercase">
              DESIGNERS DOMAIN CLUB COMPILER
            </h1>

            <p className="text-sm sm:text-base text-slate-300 font-sans leading-relaxed">
              The high-performance competitive coding and debugging arena. Select an official challenge, fix the logic, beat the clock, and climb the live leaderboards.
            </p>
          </div>

          {/* Primary Action Buttons (Participant Login / Signup or Dashboard) */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {account ? (
              <button
                onClick={onNavigateToDashboard}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold text-sm shadow-xl shadow-amber-950/40 transition-all cursor-pointer"
              >
                <Terminal className="w-4 h-4" />
                ENTER MY DASHBOARD ({account.name})
              </button>
            ) : (
              <>
                <button
                  onClick={onNavigateToLogin}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold text-sm shadow-xl shadow-amber-950/40 transition-all cursor-pointer"
                >
                  <LogIn className="w-4 h-4" />
                  LOGIN TO COMPILER
                </button>
                <button
                  onClick={onNavigateToSignUp}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-black/60 hover:bg-slate-900 text-amber-300 font-semibold text-sm border border-amber-500/40 transition-all cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  CREATE PARTICIPANT ACCOUNT
                </button>
              </>
            )}

            <button
              onClick={() => onViewRules(featuredContest)}
              className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-900/60 hover:bg-slate-800 text-slate-300 font-medium text-sm border border-slate-800 transition-colors"
            >
              <BookOpen className="w-4 h-4 text-slate-400" />
              Competition Rules
            </button>
          </div>

          {/* Designed by Aegis Branding Chip */}
          <div
            id="hero-aegis-branding"
            className="flex items-center gap-3 px-4 py-2 rounded-xl bg-slate-900/60 border border-slate-800"
          >
            <span className="text-xs uppercase tracking-widest text-slate-400 font-semibold font-mono">
              Designed by Aegis
            </span>
            <div className="h-4 w-px bg-slate-700" />
            <div className="w-24 h-6 flex items-center justify-center">
              <img
                src="/brand/aegis-logo.svg"
                alt="Aegis Logo"
                className="max-h-full max-w-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </div>

        {/* Featured Flagship Competition Spotlight (Breach the Bug) */}
        {featuredContest && (
          <div className="relative rounded-3xl bg-gradient-to-r from-[#121624] via-[#0d1017] to-[#121624] border border-amber-500/40 p-6 sm:p-10 shadow-2xl overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Left Details */}
              <div className="lg:col-span-7 space-y-4 text-left">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-mono font-bold uppercase bg-amber-500 text-slate-950">
                    Featured Competition
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    LIVE &bull; {featuredContest.status.toUpperCase()}
                  </span>
                </div>

                <h2 className="text-3xl sm:text-4xl font-extrabold text-white font-mono tracking-tight uppercase">
                  {featuredContest.title}
                </h2>

                {featuredContest.tagline && (
                  <p className="text-lg sm:text-xl font-bold text-amber-400 font-mono">
                    {featuredContest.tagline}
                  </p>
                )}

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
                  {featuredContest.description}
                </p>

                {/* Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                    <div className="text-[10px] font-mono text-slate-400 uppercase">Questions</div>
                    <div className="text-base font-bold font-mono text-white">
                      {featuredContest.totalQuestions || 5} Challenges
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                    <div className="text-[10px] font-mono text-slate-400 uppercase">Time Limit</div>
                    <div className="text-base font-bold font-mono text-white">
                      {featuredContest.durationMinutes || 45} Mins
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                    <div className="text-[10px] font-mono text-slate-400 uppercase">Total Marks</div>
                    <div className="text-base font-bold font-mono text-amber-400">
                      {featuredContest.totalMarks || 50} pts
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                    <div className="text-[10px] font-mono text-slate-400 uppercase">Languages</div>
                    <div className="text-base font-bold font-mono text-white">
                      {featuredContest.allowedLanguages?.length || 4} Runtimes
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-3 pt-4">
                  <button
                    onClick={() => onEnterContest(featuredContest)}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm tracking-wider uppercase transition-all shadow-xl shadow-amber-950/50 cursor-pointer"
                  >
                    <span>ENTER COMPETITION</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => onViewRules(featuredContest)}
                    className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    <BookOpen className="w-4 h-4 text-amber-400" />
                    <span>Competition Rules</span>
                  </button>
                </div>
              </div>

              {/* Right Decorative Terminal Visual */}
              <div className="lg:col-span-5 bg-black/80 rounded-2xl border border-slate-800 p-4 font-mono text-xs shadow-2xl text-left hidden sm:block">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                    <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono">compiler_engine.ts</span>
                </div>
                <div className="space-y-1.5 text-slate-300">
                  <p className="text-amber-400 font-semibold">// Designers Domain Club Compiler</p>
                  <p className="text-slate-500">
                    &gt; Target: <span className="text-slate-200">{featuredContest.title}</span>
                  </p>
                  <p className="text-slate-500">
                    &gt; Mode: <span className="text-emerald-400 font-bold">Strict Anti-Cheat Enforced</span>
                  </p>
                  <p className="text-slate-500">
                    &gt; Real-time Sandboxed Evaluation: <span className="text-amber-300 font-bold">ACTIVE</span>
                  </p>
                  <div className="p-3 my-2 rounded bg-slate-900/90 border border-slate-800 text-slate-200 font-mono text-[11px]">
                    <code>
                      function solveChallenge(buggyCode) &#123;
                      <br />
                      &nbsp;&nbsp;const fixed = isolateFaults(buggyCode);
                      <br />
                      &nbsp;&nbsp;return passAllHiddenTestCases(fixed);
                      <br />
                      &#125;
                    </code>
                  </div>
                  <p className="text-xs text-amber-400 font-bold">
                    &gt; Ready for participant submissions.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Contests Catalog Section */}
        <div id="contests-catalog" className="space-y-6 text-left">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-2xl font-bold text-white font-mono uppercase tracking-tight flex items-center gap-2">
                <Terminal className="w-6 h-6 text-amber-400" />
                Competition Catalog
              </h2>
              <p className="text-xs text-slate-400 font-sans mt-0.5">
                Explore all official competitions managed by the Designers Domain Club administrators.
              </p>
            </div>

            {/* Filter Tabs & Search */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative min-w-[200px]">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search contests..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex items-center bg-slate-900 p-1 rounded-lg border border-slate-800">
                {(['all', 'active', 'upcoming', 'completed'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setFilterTab(tab)}
                    className={`px-3 py-1 text-xs font-mono rounded capitalize transition-all ${
                      filterTab === tab
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Contests Grid or Empty State */}
          {filteredContests.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-[#0e1118]/80 border border-slate-800 space-y-2">
              <Terminal className="w-8 h-8 text-slate-500 mx-auto" />
              <div className="text-sm font-mono text-slate-300 font-bold">No competitions available</div>
              <p className="text-xs text-slate-500">
                There are no competitions matching your search criteria.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredContests.map((contest) => {
                const isLive = contest.status === 'active';
                const isUpcoming = contest.status === 'upcoming';

                return (
                  <div
                    key={contest.id}
                    className={`rounded-2xl bg-[#0e1118]/80 backdrop-blur-md border transition-all flex flex-col justify-between overflow-hidden group hover:shadow-xl hover:shadow-black/60 ${
                      isLive
                        ? 'border-amber-500/30 hover:border-amber-500/60'
                        : 'border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
                            isLive
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : isUpcoming
                              ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {contest.status}
                        </span>
                        <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {contest.durationMinutes} mins
                        </span>
                      </div>

                      <div>
                        <h3 className="text-lg font-bold text-white group-hover:text-amber-400 transition-colors font-mono">
                          {contest.title}
                        </h3>
                        {contest.tagline && (
                          <p className="text-xs text-amber-400/90 font-medium line-clamp-1 mt-0.5">
                            {contest.tagline}
                          </p>
                        )}
                      </div>

                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                        {contest.description}
                      </p>

                      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-300 font-mono">
                        <span>
                          <strong className="text-white">{contest.totalQuestions || 5}</strong> Questions
                        </span>
                        <span>
                          <strong className="text-amber-400">{contest.totalMarks || 50}</strong> Marks
                        </span>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-900/60 border-t border-slate-800/80 flex items-center gap-2">
                      <button
                        onClick={() => onEnterContest(contest)}
                        className={`w-full py-2.5 px-3 rounded-lg text-xs font-bold font-mono tracking-wider uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                          isLive
                            ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-md shadow-amber-950/40'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                        }`}
                      >
                        <span>{isLive ? 'Enter Competition' : 'View Details'}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
