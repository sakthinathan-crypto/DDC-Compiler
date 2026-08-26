import React, { useState, useEffect } from 'react';
import { Contest, LeaderboardEntry } from '../types';
import { api } from '../lib/api';
import {
  Trophy,
  Medal,
  Clock,
  CheckCircle2,
  Search,
  School,
  Sparkles,
  ArrowLeft,
  RotateCw,
  Award,
  Layers,
  ChevronDown,
} from 'lucide-react';

interface LeaderboardViewProps {
  currentParticipantId?: string;
  activeContest?: Contest | null;
  contests?: Contest[];
  onSelectContest?: (contest: Contest) => void;
  onBackToDashboard?: () => void;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({
  currentParticipantId,
  activeContest,
  contests = [],
  onSelectContest,
  onBackToDashboard,
}) => {
  const [selectedContestId, setSelectedContestId] = useState<string>(
    activeContest?.id || (contests.length > 0 ? contests[0].id : 'breach-the-bug-round-2')
  );
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [loading, setLoading] = useState<boolean>(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const currentContest = contests.find((c) => c.id === selectedContestId) || activeContest;

  useEffect(() => {
    if (activeContest?.id) {
      setSelectedContestId(activeContest.id);
    }
  }, [activeContest?.id]);

  useEffect(() => {
    loadLeaderboard();

    // Subscribe to SSE updates for this contest
    const unsubscribe = api.subscribeLeaderboard(selectedContestId, (data) => {
      setLeaderboard(data);
      setLastUpdated(new Date());
    });

    // Also poll every 15s as fallback
    const interval = setInterval(loadLeaderboard, 15000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [selectedContestId]);

  const loadLeaderboard = async () => {
    setLoading(true);
    try {
      const data = await api.getLeaderboard(selectedContestId);
      setLeaderboard(data);
      setLastUpdated(new Date());
    } catch (_) {
    } finally {
      setLoading(false);
    }
  };

  const handleContestChange = (cId: string) => {
    setSelectedContestId(cId);
    const found = contests.find((c) => c.id === cId);
    if (found && onSelectContest) {
      onSelectContest(found);
    }
  };

  // Filter list
  const filtered = leaderboard.filter((entry) => {
    const matchesSearch =
      entry.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.registerNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.participantId.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDept = selectedDept === 'all' || entry.department === selectedDept;

    return matchesSearch && matchesDept;
  });

  const departments = Array.from(new Set(leaderboard.map((e) => e.department))).filter(Boolean);

  const topThree = leaderboard.slice(0, 3);

  return (
    <div id="leaderboard-view" className="w-full max-w-6xl mx-auto py-6 sm:py-10 px-4 space-y-8">
      {/* Top Banner with Official Club Logo */}
      <div className="flex flex-col items-center text-center space-y-3">
        <div className="w-16 h-16 rounded-2xl bg-black/60 p-1.5 border border-amber-500/30 shadow-2xl flex items-center justify-center">
          <img
            src="/brand/club-logo.svg"
            alt="Designers Domain Club"
            className="w-full h-full object-contain"
            referrerPolicy="no-referrer"
          />
        </div>

        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-mono font-medium mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Official Live Standings</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight font-mono uppercase">
            {currentContest?.title || 'Contest'} &bull; Leaderboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 font-mono">
            Tie-Breaking: 1. Higher Score &bull; 2. Faster Completion Time
          </p>
        </div>

        {/* Contest Switcher Dropdown */}
        {contests.length > 1 && (
          <div className="flex items-center gap-2 pt-1">
            <span className="text-xs font-mono text-slate-400">Viewing Contest:</span>
            <select
              value={selectedContestId}
              onChange={(e) => handleContestChange(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-amber-400 text-xs font-mono font-bold rounded-lg px-3 py-1.5 outline-none cursor-pointer"
            >
              {contests.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title} ({c.status.toUpperCase()})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Top 3 Podium Cards */}
      {topThree.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 max-w-4xl mx-auto">
          {/* Rank 2 - Silver */}
          {topThree[1] && (
            <div className="order-2 md:order-1 p-5 rounded-2xl bg-gradient-to-b from-slate-850 to-[#0e111a] border border-slate-400/30 flex flex-col items-center text-center space-y-2 relative shadow-lg">
              <div className="w-10 h-10 rounded-full bg-slate-300/10 border border-slate-300 text-slate-200 flex items-center justify-center font-mono font-bold text-lg">
                2
              </div>
              <div className="font-bold text-white text-base">{topThree[1].name}</div>
              <div className="text-xs text-slate-400">{topThree[1].department}</div>
              <div className="pt-2 flex items-center gap-3 text-xs font-mono">
                <span className="text-amber-400 font-bold">{topThree[1].totalScore} pts</span>
                <span className="text-slate-500">&bull;</span>
                <span className="text-slate-300">{topThree[1].timeDisplay}</span>
              </div>
            </div>
          )}

          {/* Rank 1 - Gold */}
          {topThree[0] && (
            <div className="order-1 md:order-2 p-6 rounded-2xl bg-gradient-to-b from-amber-500/15 via-[#0e111a] to-[#0e111a] border border-amber-500/50 flex flex-col items-center text-center space-y-2 relative shadow-xl shadow-amber-500/5 -mt-2">
              <div className="w-12 h-12 rounded-full bg-amber-500/20 border-2 border-amber-400 text-amber-300 flex items-center justify-center font-mono font-black text-xl shadow-md">
                👑 1
              </div>
              <div className="font-extrabold text-white text-lg">{topThree[0].name}</div>
              <div className="text-xs text-slate-400">{topThree[0].department}</div>
              <div className="pt-2 flex items-center gap-3 text-xs font-mono">
                <span className="text-amber-400 font-black text-sm">{topThree[0].totalScore} pts</span>
                <span className="text-slate-500">&bull;</span>
                <span className="text-slate-300">{topThree[0].timeDisplay}</span>
              </div>
            </div>
          )}

          {/* Rank 3 - Bronze */}
          {topThree[2] && (
            <div className="order-3 md:order-3 p-5 rounded-2xl bg-gradient-to-b from-amber-900/10 to-[#0e111a] border border-amber-700/30 flex flex-col items-center text-center space-y-2 relative shadow-lg">
              <div className="w-10 h-10 rounded-full bg-amber-700/20 border border-amber-600 text-amber-500 flex items-center justify-center font-mono font-bold text-lg">
                3
              </div>
              <div className="font-bold text-white text-base">{topThree[2].name}</div>
              <div className="text-xs text-slate-400">{topThree[2].department}</div>
              <div className="pt-2 flex items-center gap-3 text-xs font-mono">
                <span className="text-amber-400 font-bold">{topThree[2].totalScore} pts</span>
                <span className="text-slate-500">&bull;</span>
                <span className="text-slate-300">{topThree[2].timeDisplay}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#0e111a] border border-slate-800 p-3 rounded-2xl">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search participant, reg no, ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-750 focus:border-amber-500 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          {departments.length > 0 && (
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="bg-slate-900 border border-slate-750 text-slate-300 text-xs rounded-lg px-2.5 py-1.5 outline-none"
            >
              <option value="all">All Departments</option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          )}

          <button
            onClick={loadLeaderboard}
            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Refresh Leaderboard"
          >
            <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="bg-[#0e111a] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#090b10] border-b border-slate-800 text-slate-400 uppercase text-[10px]">
              <tr>
                <th className="py-3 px-4 text-center w-14">Rank</th>
                <th className="py-3 px-4">Participant</th>
                <th className="py-3 px-4">Department & Reg No</th>
                <th className="py-3 px-4 text-center">Score</th>
                <th className="py-3 px-4 text-center">Solved</th>
                <th className="py-3 px-4 text-right">Time Taken</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 font-mono">
                    {loading ? 'Loading live leaderboard...' : 'No participants found matching criteria.'}
                  </td>
                </tr>
              ) : (
                filtered.map((entry) => {
                  const isCurrent = entry.participantId === currentParticipantId;
                  return (
                    <tr
                      key={entry.participantId}
                      className={`transition-colors ${
                        isCurrent
                          ? 'bg-amber-500/10 border-l-2 border-amber-400'
                          : 'hover:bg-slate-900/60'
                      }`}
                    >
                      {/* Rank */}
                      <td className="py-3.5 px-4 text-center font-bold">
                        {entry.rank === 1 ? (
                          <span className="text-amber-400 font-black text-sm">🥇 1</span>
                        ) : entry.rank === 2 ? (
                          <span className="text-slate-300 font-black text-sm">🥈 2</span>
                        ) : entry.rank === 3 ? (
                          <span className="text-amber-600 font-black text-sm">🥉 3</span>
                        ) : (
                          <span className="text-slate-400 font-mono">#{entry.rank}</span>
                        )}
                      </td>

                      {/* Participant */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-xs sm:text-sm">
                            {entry.name}
                          </span>
                          {isCurrent && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] bg-amber-500 text-slate-950 font-black">
                              YOU
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-500">{entry.participantId}</span>
                      </td>

                      {/* Dept & Reg */}
                      <td className="py-3.5 px-4 text-slate-300">
                        <div className="font-medium text-slate-200">{entry.department}</div>
                        <div className="text-[10px] text-slate-500">{entry.registerNumber}</div>
                      </td>

                      {/* Score */}
                      <td className="py-3.5 px-4 text-center font-black font-mono text-sm text-amber-400">
                        {entry.totalScore}
                      </td>

                      {/* Solved */}
                      <td className="py-3.5 px-4 text-center text-emerald-400 font-bold font-mono">
                        {entry.solvedCount} / {entry.totalQuestions}
                      </td>

                      {/* Time Taken */}
                      <td className="py-3.5 px-4 text-right font-bold text-slate-300 font-mono">
                        {entry.timeDisplay}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            entry.status === 'completed'
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : entry.status === 'disqualified'
                              ? 'bg-rose-500/10 text-rose-400'
                              : 'bg-amber-500/10 text-amber-400'
                          }`}
                        >
                          {entry.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info bar */}
        <div className="p-3 bg-[#090b10] border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-[11px] font-mono text-slate-500 gap-2">
          <div>
            Showing {filtered.length} of {leaderboard.length} contestants &bull; Live updates via SSE
          </div>
          <div>Last synced: {lastUpdated.toLocaleTimeString()}</div>
        </div>
      </div>

      {/* Back Button */}
      {onBackToDashboard && (
        <div className="flex justify-center pt-2">
          <button
            onClick={onBackToDashboard}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-bold transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Contest Workspace</span>
          </button>
        </div>
      )}
    </div>
  );
};
