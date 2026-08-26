import React, { useState } from 'react';
import { Contest, Participant } from '../types';
import { api } from '../lib/api';
import { X, User, Hash, School, Calendar, Mail, KeyRound, AlertCircle, ArrowRight } from 'lucide-react';

interface RegistrationModalProps {
  isOpen: boolean;
  contest: Contest | null;
  onClose: () => void;
  onSuccess: (participant: Participant, timeRemainingSeconds: number) => void;
}

const DEPARTMENTS = [
  'Computer Science and Engineering',
  'Information Technology',
  'Artificial Intelligence & Data Science',
  'Electronics and Communication Engineering',
  'Electrical and Electronics Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Other',
];

const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];

export const RegistrationModal: React.FC<RegistrationModalProps> = ({
  isOpen,
  contest,
  onClose,
  onSuccess,
}) => {
  const [mode, setMode] = useState<'register' | 'resume'>('register');
  const [formData, setFormData] = useState({
    name: '',
    registerNumber: '',
    department: DEPARTMENTS[0],
    year: YEARS[2], // default 3rd year
    email: '',
    participantId: `DDC-2026-${Math.floor(100 + Math.random() * 900)}`,
  });

  const [resumeId, setResumeId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !contest) return null;

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate fields
    if (
      !formData.name.trim() ||
      !formData.registerNumber.trim() ||
      !formData.department ||
      !formData.year ||
      !formData.email.trim() ||
      !formData.participantId.trim()
    ) {
      setError('Please fill in all required fields.');
      return;
    }

    if (!formData.email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.registerParticipant(contest.id, formData);
      onSuccess(res.participant, res.timeRemainingSeconds);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  const handleResumeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resumeId.trim()) {
      setError('Please enter your Participant ID to resume.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await api.getParticipant(contest.id, resumeId.trim());
      onSuccess(res.participant, res.timeRemainingSeconds);
    } catch (err: any) {
      setError('Participant ID not found for this contest. Please register or verify your ID.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg bg-[#0e111a] border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 my-8 text-left">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header with Club Logo */}
        <div className="flex items-center gap-3.5 mb-6 pb-4 border-b border-slate-800">
          <div className="w-12 h-12 rounded-xl bg-black/50 p-1 border border-amber-500/30 flex-shrink-0 flex items-center justify-center overflow-hidden">
            <img
              src="/brand/club-logo.png"
              alt="Designers Domain Club"
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              Participant Entry
            </h2>
            <p className="text-xs font-mono text-amber-400">
              {contest.title} &bull; Designers Domain Club
            </p>
          </div>
        </div>

        {/* Mode switcher: Register vs Resume */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-slate-900 rounded-xl mb-5 text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setError(null);
            }}
            className={`py-2 rounded-lg transition-all ${
              mode === 'register'
                ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            New Registration
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('resume');
              setError(null);
            }}
            className={`py-2 rounded-lg transition-all ${
              mode === 'resume'
                ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Resume Session
          </button>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {mode === 'register' ? (
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Full Name <span className="text-amber-400">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Arun Kumar"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-750 focus:border-amber-500 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 outline-none transition-colors"
                />
              </div>
            </div>

            {/* Register Number & Participant ID in 2 columns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Register Number <span className="text-amber-400">*</span>
                </label>
                <div className="relative">
                  <Hash className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. 917721104001"
                    value={formData.registerNumber}
                    onChange={(e) => setFormData({ ...formData, registerNumber: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-750 focus:border-amber-500 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Participant ID <span className="text-amber-400">*</span>
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. DDC-2026-101"
                    value={formData.participantId}
                    onChange={(e) => setFormData({ ...formData, participantId: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-750 focus:border-amber-500 rounded-lg pl-9 pr-3 py-2 text-sm font-mono text-amber-300 outline-none transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Department & Year */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Department <span className="text-amber-400">*</span>
                </label>
                <div className="relative">
                  <School className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-750 focus:border-amber-500 rounded-lg pl-9 pr-3 py-2 text-sm text-white outline-none transition-colors"
                  >
                    {DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Year of Study <span className="text-amber-400">*</span>
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <select
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-750 focus:border-amber-500 rounded-lg pl-9 pr-3 py-2 text-sm text-white outline-none transition-colors"
                  >
                    {YEARS.map((yr) => (
                      <option key={yr} value={yr}>
                        {yr}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                College / Personal Email <span className="text-amber-400">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  placeholder="e.g. arun@college.edu"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-750 focus:border-amber-500 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 outline-none transition-colors"
                />
              </div>
            </div>

            {/* Notice */}
            <div className="p-2.5 rounded-lg bg-amber-500/5 border border-amber-500/20 text-[11px] text-amber-300/90 font-mono">
              Note: {contest.durationMinutes}-minute contest timer begins immediately upon registration.
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <span>Starting Contest...</span>
              ) : (
                <>
                  <span>Begin {contest.title} ({contest.durationMinutes} Mins)</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResumeSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Enter your Participant ID <span className="text-amber-400">*</span>
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  placeholder="e.g. DDC-2026-101"
                  value={resumeId}
                  onChange={(e) => setResumeId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-750 focus:border-amber-500 rounded-lg pl-9 pr-3 py-2 text-sm font-mono text-white placeholder-slate-500 outline-none transition-colors"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Resume your active session in {contest.title}.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <span>Verifying ID...</span>
              ) : (
                <>
                  <span>Resume Contest</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
