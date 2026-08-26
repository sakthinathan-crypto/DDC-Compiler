import React, { useState } from 'react';
import { api } from '../lib/api';
import { ParticipantAccount } from '../types';
import { LogIn, UserPlus, KeyRound, Mail, AlertCircle, Sparkles, CheckCircle2, ShieldCheck } from 'lucide-react';

interface ParticipantLoginProps {
  onSuccess: (account: ParticipantAccount) => void;
  onNavigateToSignUp: () => void;
  onBackToLanding?: () => void;
}

export const ParticipantLogin: React.FC<ParticipantLoginProps> = ({
  onSuccess,
  onNavigateToSignUp,
  onBackToLanding,
}) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      setErrorMsg('Please enter your Email or Participant ID and Password.');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg(null);
      setErrorCode(null);

      const res = await api.participantLogin(identifier.trim(), password);
      if (res.success && res.account) {
        onSuccess(res.account);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed. Please check your credentials.');
      setErrorCode(err.code || null);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoFill = (email: string, pass: string) => {
    setIdentifier(email);
    setPassword(pass);
    setErrorMsg(null);
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Top Logo & Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-black/60 border border-amber-500/30 p-2 shadow-xl shadow-amber-950/20 mb-4 backdrop-blur-md">
            <img
              src="/brand/club-logo.svg"
              alt="Designers Domain Club Logo"
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-sans">
            Participant Login
          </h1>
          <p className="text-xs text-amber-400/90 font-medium tracking-wide uppercase mt-1">
            Designers Domain Club Compiler
          </p>
        </div>

        {/* Login Card */}
        <div className="relative rounded-2xl bg-[#0e1118]/80 backdrop-blur-xl border border-amber-500/20 p-6 sm:p-8 shadow-2xl shadow-black/80">
          {/* Subtle gold glow accent */}
          <div className="absolute -top-px left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" />

          {/* Error Banner */}
          {errorMsg && (
            <div className="mb-6 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-200 text-xs flex flex-col gap-2">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                <span className="leading-relaxed">{errorMsg}</span>
              </div>
              {errorCode === 'ACCOUNT_NOT_FOUND' && (
                <div className="pt-2 border-t border-rose-500/20 flex justify-end">
                  <button
                    type="button"
                    onClick={onNavigateToSignUp}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs transition-colors"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    CREATE ACCOUNT
                  </button>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Email Address / Participant ID
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g. arunkumar@college.edu or DDC-2026-101"
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 bg-black/40 border border-slate-700/80 focus:border-amber-400 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[11px] text-amber-400/90 hover:text-amber-300 font-medium"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 bg-black/40 border border-slate-700/80 focus:border-amber-400 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold text-sm tracking-wide transition-all shadow-lg shadow-amber-950/40 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  LOGIN TO COMPILER
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials for Evaluation */}
          <div className="mt-6 pt-5 border-t border-slate-800/80 text-center">
            <p className="text-[11px] font-mono text-slate-400 mb-2">
              Quick Demo Fill:
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <button
                type="button"
                onClick={() => handleDemoFill('arunkumar@college.edu', 'password123')}
                className="px-2.5 py-1 text-[11px] font-mono rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
              >
                Arun Kumar (Rank 1 Demo)
              </button>
              <button
                type="button"
                onClick={() => handleDemoFill('priya.d@college.edu', 'password123')}
                className="px-2.5 py-1 text-[11px] font-mono rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
              >
                Priya D (Rank 2 Demo)
              </button>
            </div>
          </div>

          {/* Bottom Switch to Sign Up */}
          <div className="mt-6 text-center text-xs text-slate-400">
            Don't have a participant account?{' '}
            <button
              type="button"
              onClick={onNavigateToSignUp}
              className="text-amber-400 font-semibold hover:underline cursor-pointer ml-1"
            >
              Sign Up Here
            </button>
          </div>
        </div>

        {onBackToLanding && (
          <div className="text-center mt-4">
            <button
              onClick={onBackToLanding}
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              ← Back to Contests Overview
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
