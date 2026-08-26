import React from 'react';
import { Contest, Participant, ParticipantAccount } from '../types';
import {
  Trophy,
  BookOpen,
  Timer,
  LogOut,
  Layers,
  Award,
  User,
  LogIn,
  UserPlus,
  LayoutDashboard,
} from 'lucide-react';

interface HeaderProps {
  activeContest?: Contest | null;
  participant?: Participant | null;
  account?: ParticipantAccount | null;
  timeRemainingSeconds?: number;
  currentView: string;
  onNavigate: (
    view:
      | 'landing'
      | 'login'
      | 'signup'
      | 'dashboard'
      | 'leaderboard'
      | 'rules'
      | 'results'
      | 'profile'
      | 'admin'
  ) => void;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeContest,
  participant,
  account,
  timeRemainingSeconds = 0,
  currentView,
  onNavigate,
  onLogout,
}) => {
  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isLowTime = timeRemainingSeconds > 0 && timeRemainingSeconds < 300;

  return (
    <header
      id="app-header"
      className="sticky top-0 z-40 w-full bg-[#080808]/95 backdrop-blur-xl border-b border-amber-500/15 px-4 lg:px-8 py-2.5 transition-all shadow-lg shadow-black/40"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Left: Designers Domain Club Logo & Title */}
        <div
          id="header-brand"
          className="flex items-center gap-3 cursor-pointer group select-none"
          onClick={() => onNavigate(account ? 'dashboard' : 'landing')}
        >
          <div className="relative w-10 h-10 sm:w-11 sm:h-11 flex-shrink-0 bg-black/60 rounded-xl p-1 border border-amber-500/30 group-hover:border-amber-500/70 transition-colors shadow-md shadow-amber-950/20">
            <img
              src="/brand/club-logo.svg"
              alt="Designers Domain Club Logo"
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-bold tracking-tight text-white text-sm sm:text-base group-hover:text-amber-400 transition-colors font-sans">
                Designers Domain Club
              </span>
              <span className="px-1.5 py-0.5 text-[10px] uppercase font-bold tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/25 rounded">
                Compiler
              </span>
            </div>
            <span className="hidden sm:inline text-xs text-slate-400 font-mono">
              {activeContest ? activeContest.title : 'Competitive Coding Platform'}
            </span>
          </div>
        </div>

        {/* Center: Live Timer if in competition workspace */}
        {participant && participant.status !== 'completed' && timeRemainingSeconds > 0 && (
          <div
            id="header-timer-pill"
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs sm:text-sm font-mono font-semibold shadow-sm transition-colors ${
              isLowTime
                ? 'bg-rose-500/10 border-rose-500/40 text-rose-300 animate-pulse'
                : 'bg-black/60 border-amber-500/30 text-amber-300'
            }`}
          >
            <Timer className={`w-3.5 h-3.5 ${isLowTime ? 'text-rose-400' : 'text-amber-400'}`} />
            <span className="hidden xs:inline text-slate-400 text-xs">Timer:</span>
            <span className="font-bold tracking-wider">{formatTime(timeRemainingSeconds)}</span>
          </div>
        )}

        {/* Right: Participant Navigation & Actions */}
        <div id="header-actions" className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Dashboard Link (if logged in) */}
          {account && (
            <button
              id="nav-dashboard-btn"
              onClick={() => onNavigate('dashboard')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                currentView === 'dashboard'
                  ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900 border border-transparent'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden md:inline">Dashboard</span>
            </button>
          )}

          {/* Contests Browse Link */}
          <button
            id="nav-catalog-btn"
            onClick={() => onNavigate('landing')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              currentView === 'landing'
                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-900 border border-transparent'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Contests</span>
          </button>

          {/* My Results Link (if logged in) */}
          {account && (
            <button
              id="nav-results-btn"
              onClick={() => onNavigate('results')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                currentView === 'results'
                  ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900 border border-transparent'
              }`}
            >
              <Award className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden lg:inline">My Results</span>
            </button>
          )}

          {/* Rules Modal Trigger */}
          <button
            id="nav-rules-btn"
            onClick={() => onNavigate('rules')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-900 transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden lg:inline">Rules</span>
          </button>

          {/* Participant Auth Area */}
          {account ? (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
              {/* Profile Chip */}
              <div
                onClick={() => onNavigate('profile')}
                className={`flex items-center gap-2 px-2.5 py-1 rounded-xl cursor-pointer transition-all border ${
                  currentView === 'profile'
                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                    : 'bg-black/40 border-slate-800 hover:border-slate-700 text-slate-200'
                }`}
                title="View & Edit Participant Profile"
              >
                <div className="w-6 h-6 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center text-[10px] font-bold">
                  {account.name ? account.name.charAt(0).toUpperCase() : 'P'}
                </div>
                <div className="hidden sm:flex flex-col text-left leading-tight">
                  <span className="text-xs font-semibold text-white truncate max-w-[110px]">
                    {account.name}
                  </span>
                  <span className="text-[10px] font-mono text-amber-400">
                    {account.participantId}
                  </span>
                </div>
              </div>

              {/* Logout Button */}
              {onLogout && (
                <button
                  id="header-logout-btn"
                  onClick={onLogout}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-rose-400 hover:text-rose-200 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 hover:border-rose-500/50 rounded-xl transition-all cursor-pointer shadow-sm"
                  title="Log Out of Compiler"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 pl-1 sm:pl-2 border-l border-slate-800">
              <button
                id="header-login-btn"
                onClick={() => onNavigate('login')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  currentView === 'login'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 border border-amber-500/30'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>LOGIN</span>
              </button>

              <button
                id="header-signup-btn"
                onClick={() => onNavigate('signup')}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold text-xs shadow-md shadow-amber-950/30 transition-all cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">SIGN UP</span>
                <span className="sm:hidden">JOIN</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
