import React, { useState } from 'react';
import { api } from '../lib/api';
import { ParticipantAccount } from '../types';
import { UserPlus, LogIn, Mail, Lock, User, Hash, Phone, Building2, GraduationCap, AlertCircle, CheckCircle2 } from 'lucide-react';

interface ParticipantSignUpProps {
  onSuccess: (account: ParticipantAccount) => void;
  onNavigateToLogin: () => void;
  onBackToLanding?: () => void;
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

export const ParticipantSignUp: React.FC<ParticipantSignUpProps> = ({
  onSuccess,
  onNavigateToLogin,
  onBackToLanding,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    registerNumber: '',
    mobile: '',
    email: '',
    department: 'Computer Science and Engineering',
    year: '3rd Year',
    college: 'Sri Sairam Engineering College',
    password: '',
    confirmPassword: '',
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrorMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Basic Validations
    if (
      !formData.name.trim() ||
      !formData.registerNumber.trim() ||
      !formData.mobile.trim() ||
      !formData.email.trim() ||
      !formData.college.trim() ||
      !formData.password
    ) {
      setErrorMsg('All fields are required.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setErrorMsg('Passwords do not match. Please re-enter.');
      return;
    }

    if (formData.password.length < 4) {
      setErrorMsg('Password must be at least 4 characters long.');
      return;
    }

    try {
      setLoading(true);
      const res = await api.participantRegister({
        name: formData.name.trim(),
        registerNumber: formData.registerNumber.trim(),
        mobile: formData.mobile.trim(),
        email: formData.email.trim(),
        department: formData.department,
        year: formData.year,
        college: formData.college.trim(),
        password: formData.password,
      });

      if (res.success && res.account) {
        setSuccessMsg(`Account created successfully! Welcome, ${res.account.name}. Redirecting to compiler...`);
        setTimeout(() => {
          onSuccess(res.account);
        }, 1200);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl">
        {/* Top Logo & Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-black/60 border border-amber-500/30 p-2 shadow-xl shadow-amber-950/20 mb-4 backdrop-blur-md overflow-hidden">
            <img
              src="/brand/club-logo.png"
              alt="Designers Domain Club Logo"
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Create Participant Account
          </h1>
          <p className="text-xs text-amber-400/90 font-medium tracking-wide uppercase mt-1">
            Designers Domain Club Compiler
          </p>
        </div>

        {/* SignUp Card */}
        <div className="relative rounded-2xl bg-[#0e1118]/80 backdrop-blur-xl border border-amber-500/20 p-6 sm:p-8 shadow-2xl shadow-black/80">
          <div className="absolute -top-px left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" />

          {/* Success Banner */}
          {successMsg && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 text-sm flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Error Banner */}
          {errorMsg && (
            <div className="mb-6 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Full Name <span className="text-amber-400">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="e.g. Arun Kumar"
                    required
                    className="w-full pl-10 pr-3.5 py-2.5 bg-black/40 border border-slate-700/80 focus:border-amber-400 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* Register Number */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Register Number <span className="text-amber-400">*</span>
                </label>
                <div className="relative">
                  <Hash className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={formData.registerNumber}
                    onChange={(e) => handleChange('registerNumber', e.target.value)}
                    placeholder="e.g. 917721104001"
                    required
                    className="w-full pl-10 pr-3.5 py-2.5 bg-black/40 border border-slate-700/80 focus:border-amber-400 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none transition-all font-mono"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Email Address <span className="text-amber-400">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    placeholder="arunkumar@college.edu"
                    required
                    className="w-full pl-10 pr-3.5 py-2.5 bg-black/40 border border-slate-700/80 focus:border-amber-400 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* Mobile Number */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Mobile Number <span className="text-amber-400">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={formData.mobile}
                    onChange={(e) => handleChange('mobile', e.target.value)}
                    placeholder="+91 9876543210"
                    required
                    className="w-full pl-10 pr-3.5 py-2.5 bg-black/40 border border-slate-700/80 focus:border-amber-400 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* Department */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Department <span className="text-amber-400">*</span>
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <select
                    value={formData.department}
                    onChange={(e) => handleChange('department', e.target.value)}
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

              {/* Year */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Year of Study <span className="text-amber-400">*</span>
                </label>
                <div className="relative">
                  <GraduationCap className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <select
                    value={formData.year}
                    onChange={(e) => handleChange('year', e.target.value)}
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

            {/* College */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                College / Institution Name <span className="text-amber-400">*</span>
              </label>
              <input
                type="text"
                value={formData.college}
                onChange={(e) => handleChange('college', e.target.value)}
                placeholder="e.g. Sri Sairam Engineering College"
                required
                className="w-full px-3.5 py-2.5 bg-black/40 border border-slate-700/80 focus:border-amber-400 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none transition-all"
              />
            </div>

            {/* Passwords */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Password <span className="text-amber-400">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => handleChange('password', e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full pl-10 pr-3.5 py-2.5 bg-black/40 border border-slate-700/80 focus:border-amber-400 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Confirm Password <span className="text-amber-400">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleChange('confirmPassword', e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full pl-10 pr-3.5 py-2.5 bg-black/40 border border-slate-700/80 focus:border-amber-400 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold text-sm tracking-wide transition-all shadow-lg shadow-amber-950/40 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    CREATE PARTICIPANT ACCOUNT
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Switch to Login */}
          <div className="mt-6 text-center text-xs text-slate-400 border-t border-slate-800/80 pt-5">
            Already have a participant account?{' '}
            <button
              type="button"
              onClick={onNavigateToLogin}
              className="text-amber-400 font-semibold hover:underline cursor-pointer ml-1"
            >
              Login Here
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
