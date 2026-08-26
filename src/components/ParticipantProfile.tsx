import React, { useState } from 'react';
import { ParticipantAccount } from '../types';
import { api } from '../lib/api';
import {
  User,
  Hash,
  Mail,
  Phone,
  Building2,
  GraduationCap,
  Shield,
  Save,
  CheckCircle2,
  AlertCircle,
  Award,
  Clock,
  Sparkles,
  Lock,
  LogOut,
} from 'lucide-react';

interface ParticipantProfileProps {
  account: ParticipantAccount;
  onProfileUpdate: (updated: ParticipantAccount) => void;
  onViewResults: () => void;
  onBackToDashboard: () => void;
  onLogout?: () => void;
}

const DEPARTMENTS = [
  'Computer Science and Engineering',
  'Information Technology',
  'Artificial Intelligence & Data Science',
  'Electronics and Communication Engineering',
  'Electrical and Electronics Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Other Department',
];

const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];

export const ParticipantProfile: React.FC<ParticipantProfileProps> = ({
  account,
  onProfileUpdate,
  onViewResults,
  onBackToDashboard,
  onLogout,
}) => {
  const [formData, setFormData] = useState({
    name: account.name,
    mobile: account.mobile || '',
    department: account.department,
    year: account.year,
    college: account.college || 'Sri Sairam Engineering College',
  });

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);
    setSaveSuccess(false);

    try {
      setSaving(true);
      const updated = await api.updateParticipantProfile(account.participantId, formData);
      onProfileUpdate(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setSaveError(err.message || 'Failed to save profile changes');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-800">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/20 via-black to-amber-950/40 border border-amber-500/30 flex items-center justify-center p-3 text-amber-400 shadow-lg shadow-amber-950/30">
            <User className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-sans">
                {account.name}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-amber-500/10 border border-amber-500/30 text-amber-400">
                {account.participantId}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
              <span>{account.department}</span>
              <span>•</span>
              <span className="text-amber-400/90">{account.year}</span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button
            onClick={onViewResults}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
          >
            <Award className="w-3.5 h-3.5 text-amber-400" />
            My Results
          </button>
          <button
            onClick={onBackToDashboard}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition-colors cursor-pointer"
          >
            Dashboard
          </button>
          {onLogout && (
            <button
              id="profile-logout-btn"
              onClick={onLogout}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 hover:text-rose-200 text-xs font-semibold border border-rose-500/30 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>
          )}
        </div>
      </div>

      {/* Profile Form Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Editable & Verified Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl bg-[#0e1118]/80 backdrop-blur-xl border border-amber-500/20 p-6 sm:p-7 shadow-xl shadow-black/80">
            <h2 className="text-base font-bold text-white mb-1 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Participant Credentials
            </h2>
            <p className="text-xs text-slate-400 mb-6">
              Update your contact and institutional profile for official certification.
            </p>

            {saveSuccess && (
              <div className="mb-5 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>Profile details successfully updated and synchronized!</span>
              </div>
            )}

            {saveError && (
              <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <span>{saveError}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full pl-10 pr-3.5 py-2.5 bg-black/40 border border-slate-700/80 focus:border-amber-400 rounded-xl text-sm text-white focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* Locked System Fields (Register Number & Email) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Register Number
                    </label>
                    <span className="text-[10px] text-slate-500 flex items-center gap-1 font-mono">
                      <Lock className="w-2.5 h-2.5" /> Locked
                    </span>
                  </div>
                  <div className="relative">
                    <Hash className="w-4 h-4 text-slate-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={account.registerNumber}
                      disabled
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-900/60 border border-slate-800 text-slate-400 rounded-xl text-sm font-mono cursor-not-allowed"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Email Address
                    </label>
                    <span className="text-[10px] text-slate-500 flex items-center gap-1 font-mono">
                      <Lock className="w-2.5 h-2.5" /> Locked
                    </span>
                  </div>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={account.email}
                      disabled
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-900/60 border border-slate-800 text-slate-400 rounded-xl text-sm cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              {/* Mobile Number */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Mobile Number
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    required
                    placeholder="+91 9876543210"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-black/40 border border-slate-700/80 focus:border-amber-400 rounded-xl text-sm text-white focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* Department & Year */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                    Department
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <select
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      className="w-full pl-10 pr-3.5 py-2.5 bg-black/40 border border-slate-700/80 focus:border-amber-400 rounded-xl text-sm text-white focus:outline-none transition-all"
                    >
                      {DEPARTMENTS.map((dept) => (
                        <option key={dept} value={dept} className="bg-slate-900 text-white">
                          {dept}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                    Year of Study
                  </label>
                  <div className="relative">
                    <GraduationCap className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <select
                      value={formData.year}
                      onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                      className="w-full pl-10 pr-3.5 py-2.5 bg-black/40 border border-slate-700/80 focus:border-amber-400 rounded-xl text-sm text-white focus:outline-none transition-all"
                    >
                      {YEARS.map((yr) => (
                        <option key={yr} value={yr} className="bg-slate-900 text-white">
                          {yr}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* College Name */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  College / Institution
                </label>
                <input
                  type="text"
                  value={formData.college}
                  onChange={(e) => setFormData({ ...formData, college: e.target.value })}
                  required
                  className="w-full px-3.5 py-2.5 bg-black/40 border border-slate-700/80 focus:border-amber-400 rounded-xl text-sm text-white focus:outline-none transition-all"
                />
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold text-xs tracking-wider uppercase transition-all shadow-md shadow-amber-950/40 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {saving ? (
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      SAVE PROFILE CHANGES
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right 1 Column: Security & Integrity Policy */}
        <div className="space-y-6">
          <div className="rounded-2xl bg-[#0e1118]/80 backdrop-blur-xl border border-slate-800 p-6 shadow-xl">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-3">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white mb-2">
              Academic Integrity Shield
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Your registered details are bound to your competition submissions.
              Contest scores, completion timestamps, and leaderboard standings are evaluated
              server-side and are immutable.
            </p>
            <div className="mt-4 pt-4 border-t border-slate-800 space-y-2 text-[11px] text-slate-400 font-mono">
              <div className="flex justify-between">
                <span>Account ID:</span>
                <span className="text-amber-400">{account.participantId}</span>
              </div>
              <div className="flex justify-between">
                <span>Joined Date:</span>
                <span className="text-slate-300">
                  {new Date(account.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Verification:</span>
                <span className="text-emerald-400 font-semibold">Active & Valid</span>
              </div>
            </div>
          </div>

          {/* Session & Sign Out Card */}
          {onLogout && (
            <div className="rounded-2xl bg-[#0e1118]/80 backdrop-blur-xl border border-rose-500/20 p-6 shadow-xl space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <LogOut className="w-4 h-4 text-rose-400" />
                Session Management
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Log out of your current session on this computer. You can sign back in at any time with your Register Number and Password.
              </p>
              <button
                type="button"
                onClick={onLogout}
                className="w-full py-2.5 px-4 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 hover:text-rose-200 border border-rose-500/30 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out of Account</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
