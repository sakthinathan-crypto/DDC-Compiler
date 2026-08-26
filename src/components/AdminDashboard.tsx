import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { Contest, Question, LeaderboardEntry, Submission } from '../types';
import { api } from '../lib/api';
import {
  ShieldAlert,
  Plus,
  Trash2,
  Edit,
  Save,
  Download,
  Users,
  Code2,
  Trophy,
  Clock,
  RotateCcw,
  CheckCircle2,
  XCircle,
  FileText,
  AlertCircle,
  Layers,
  Copy,
  Check,
  Send,
  Eye,
  Settings,
  Sparkles,
  LogOut,
} from 'lucide-react';

interface AdminDashboardProps {
  onBack: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBack }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [password, setPassword] = useState<string>('');
  const [authError, setAuthError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<
    'contests' | 'questions' | 'participants' | 'submissions'
  >('contests');

  // Multi-contest data states
  const [contests, setContests] = useState<Contest[]>([]);
  const [selectedContestId, setSelectedContestId] = useState<string>('breach-the-bug-round-2');
  const [editingContest, setEditingContest] = useState<any | null>(null);

  // Question bank states
  const [questionBank, setQuestionBank] = useState<Question[]>([]);
  const [editingQuestion, setEditingQuestion] = useState<any | null>(null);

  // Participants & Submissions
  const [participants, setParticipants] = useState<LeaderboardEntry[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);

  const [loading, setLoading] = useState<boolean>(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    // Set up SSE listener for live updates
    const unsubscribe = api.subscribeLeaderboard(selectedContestId, (data) => {
      setParticipants(data);
      // Also fetch updated submissions
      api.getSubmissions(selectedContestId).then((subs) => setSubmissions(subs)).catch(() => {});
    });

    return () => {
      unsubscribe();
    };
  }, [isAuthenticated, selectedContestId]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    try {
      const res = await api.adminAuth(password);
      if (res.success) {
        setIsAuthenticated(true);
        loadAdminData();
      }
    } catch (err: any) {
      setAuthError(err.message || 'Invalid admin passcode (e.g. "aegis2026")');
    }
  };

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [allContests, allQuestions] = await Promise.all([
        api.getAdminContests(),
        api.getAdminQuestionBank(),
      ]);
      setContests(allContests);
      setQuestionBank(allQuestions);

      const targetContestId = selectedContestId || (allContests[0] ? allContests[0].id : 'breach-the-bug-2026');
      const [lb, subs] = await Promise.all([
        api.getLeaderboard(targetContestId),
        api.getSubmissions(targetContestId),
      ]);
      setParticipants(lb);
      setSubmissions(subs);
    } catch (_) {
    } finally {
      setLoading(false);
    }
  };

  // Reload participants when switching contest in participants or submissions tab
  const handleContestChange = async (cId: string) => {
    setSelectedContestId(cId);
    try {
      const [lb, subs] = await Promise.all([
        api.getLeaderboard(cId),
        api.getSubmissions(cId),
      ]);
      setParticipants(lb);
      setSubmissions(subs);
    } catch (_) {}
  };

  // --- CONTEST OPERATIONS ---
  const handleSaveContest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingContest) return;

    try {
      await api.saveAdminContest(editingContest);
      setMsg(`Contest "${editingContest.title}" saved successfully!`);
      setEditingContest(null);
      loadAdminData();
      setTimeout(() => setMsg(null), 3000);
    } catch (err: any) {
      alert('Error saving contest: ' + err.message);
    }
  };

  const handleDeleteContest = async (id: string) => {
    if (window.confirm(`Permanently delete contest "${id}" and all its participant data?`)) {
      try {
        await api.deleteAdminContest(id);
        setMsg('Contest deleted');
        loadAdminData();
        setTimeout(() => setMsg(null), 3000);
      } catch (err: any) {
        alert('Error deleting contest: ' + err.message);
      }
    }
  };

  const handleDuplicateContest = async (c: Contest) => {
    const newId = `${c.id}-copy-${Math.floor(Math.random() * 1000)}`;
    const duplicated: Contest = {
      ...c,
      id: newId,
      title: `${c.title} (Copy)`,
      status: 'draft',
      participantCount: 0,
    };
    try {
      await api.saveAdminContest(duplicated);
      setMsg(`Contest duplicated as "${duplicated.title}"`);
      loadAdminData();
      setTimeout(() => setMsg(null), 3000);
    } catch (err: any) {
      alert('Error duplicating contest: ' + err.message);
    }
  };

  // --- QUESTION BANK OPERATIONS ---
  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuestion) return;

    try {
      await api.saveAdminQuestion(editingQuestion);
      setMsg(`Question "${editingQuestion.title}" saved in Question Bank!`);
      setEditingQuestion(null);
      loadAdminData();
      setTimeout(() => setMsg(null), 3000);
    } catch (err: any) {
      alert('Error saving question: ' + err.message);
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    if (window.confirm('Delete this question permanently from the global Question Bank?')) {
      try {
        await api.deleteAdminQuestion(id);
        setMsg('Question deleted');
        loadAdminData();
        setTimeout(() => setMsg(null), 3000);
      } catch (err: any) {
        alert('Error deleting question: ' + err.message);
      }
    }
  };

  // --- PARTICIPANT ACTIONS ---
  const handleParticipantAction = async (participantId: string, action: string) => {
    try {
      await api.participantAction(selectedContestId, participantId, action);
      loadAdminData();
      setMsg(`Action "${action}" applied to participant`);
      setTimeout(() => setMsg(null), 3000);
    } catch (err: any) {
      alert('Error updating participant: ' + err.message);
    }
  };

  const handleExportCSV = () => {
    window.location.href = `/api/admin/export?contestId=${selectedContestId}&format=csv`;
  };

  const handleExportJSON = () => {
    window.location.href = `/api/admin/export?contestId=${selectedContestId}&format=json`;
  };

  if (!isAuthenticated) {
    return (
      <div className="w-full max-w-md mx-auto py-16 px-4">
        <div className="bg-[#0e111a] border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="w-14 h-14 rounded-2xl bg-black/60 p-1 border border-amber-500/30 flex items-center justify-center overflow-hidden">
              <img
                src="/brand/club-logo.png"
                alt="Designers Domain Club"
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white font-mono">Admin Authorization</h2>
              <p className="text-xs text-slate-400 font-mono">
                Designers Domain Club &bull; Compiler Platform
              </p>
            </div>
          </div>

          {authError && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono">
              {authError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Admin Security Passcode
              </label>
              <input
                type="password"
                required
                placeholder="Enter passcode (e.g. aegis2026)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-900 border border-slate-750 focus:border-amber-500 rounded-lg px-3 py-2 text-sm text-white outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs font-mono transition-all cursor-pointer"
            >
              Authenticate Admin
            </button>
          </form>

          <button
            onClick={onBack}
            className="w-full py-2 text-xs text-slate-400 hover:text-white transition-colors"
          >
            &larr; Back to App
          </button>
        </div>
      </div>
    );
  }

  return (
    <div id="admin-dashboard" className="w-full max-w-7xl mx-auto py-6 px-4 space-y-6">
      {/* Admin Header with Official Club Logo */}
      <div className="bg-[#0e111a] border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-black/60 p-1 border border-amber-500/30 flex items-center justify-center overflow-hidden">
            <img
              src="/brand/club-logo.png"
              alt="Club Logo"
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                ADMIN CONTROL CENTER
              </span>
              <span className="text-xs font-mono text-slate-400">Designers Domain Club</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white font-mono">
              Contest Management & Question Bank
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-mono font-bold transition-colors cursor-pointer"
            title="Export Contest Data as CSV"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handleExportJSON}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-mono font-bold transition-colors cursor-pointer"
            title="Export Contest Data as JSON"
          >
            <FileText className="w-3.5 h-3.5 text-sky-400" />
            <span>Export JSON</span>
          </button>
          <button
            onClick={() => {
              setIsAuthenticated(false);
              setPassword('');
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-mono font-bold transition-colors cursor-pointer"
            title="Lock Admin Session"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Lock Admin</span>
          </button>
          <button
            onClick={onBack}
            className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono transition-colors cursor-pointer"
          >
            Exit Admin
          </button>
        </div>
      </div>

      {msg && (
        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{msg}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-800 gap-2 text-xs font-mono">
        <button
          onClick={() => setActiveTab('contests')}
          className={`pb-3 px-4 border-b-2 font-bold transition-colors flex items-center gap-2 ${
            activeTab === 'contests'
              ? 'border-amber-400 text-amber-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Contests Hub ({contests.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('questions')}
          className={`pb-3 px-4 border-b-2 font-bold transition-colors flex items-center gap-2 ${
            activeTab === 'questions'
              ? 'border-amber-400 text-amber-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Code2 className="w-4 h-4" />
          <span>Central Question Bank ({questionBank.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('participants')}
          className={`pb-3 px-4 border-b-2 font-bold transition-colors flex items-center gap-2 ${
            activeTab === 'participants'
              ? 'border-amber-400 text-amber-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Participants & Timers ({participants.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('submissions')}
          className={`pb-3 px-4 border-b-2 font-bold transition-colors flex items-center gap-2 ${
            activeTab === 'submissions'
              ? 'border-amber-400 text-amber-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Send className="w-4 h-4" />
          <span>Submissions Stream ({submissions.length})</span>
        </button>
      </div>

      {/* --- TAB 1: CONTESTS HUB --- */}
      {activeTab === 'contests' && (
        <div className="space-y-6 text-left">
          {editingContest ? (
            /* Contest Creator & Editor Modal/Form */
            <form
              onSubmit={handleSaveContest}
              className="bg-[#0e111a] border border-slate-800 rounded-2xl p-6 space-y-5"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
                  <Layers className="w-4 h-4 text-amber-400" />
                  <span>
                    {editingContest.id ? `Edit Contest: ${editingContest.title}` : 'Create New Contest'}
                  </span>
                </h3>
                <button
                  type="button"
                  onClick={() => setEditingContest(null)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Contest ID / Slug <span className="text-amber-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. code-clash-2026"
                    value={editingContest.id || ''}
                    onChange={(e) => setEditingContest({ ...editingContest, id: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-750 rounded p-2 text-xs font-mono text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Contest Title <span className="text-amber-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Code Clash 2026"
                    value={editingContest.title || ''}
                    onChange={(e) => setEditingContest({ ...editingContest, title: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-750 rounded p-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Tagline / Subtitle
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Debug the Impossible"
                    value={editingContest.tagline || ''}
                    onChange={(e) => setEditingContest({ ...editingContest, tagline: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-750 rounded p-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={300}
                    required
                    value={editingContest.durationMinutes || 30}
                    onChange={(e) =>
                      setEditingContest({
                        ...editingContest,
                        durationMinutes: parseInt(e.target.value) || 30,
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-750 rounded p-2 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Status</label>
                  <select
                    value={editingContest.status || 'active'}
                    onChange={(e) =>
                      setEditingContest({ ...editingContest, status: e.target.value })
                    }
                    className="w-full bg-slate-900 border border-slate-750 rounded p-2 text-xs text-white"
                  >
                    <option value="draft">Draft (Hidden from Catalog)</option>
                    <option value="upcoming">Upcoming (Listed, Registration Pre-open)</option>
                    <option value="active">Active & Live (Ongoing Competition)</option>
                    <option value="completed">Completed (Archived / Practice)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Registration & Visibility
                  </label>
                  <div className="flex items-center gap-4 pt-2 text-xs text-slate-300">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editingContest.allowRegistration !== false}
                        onChange={(e) =>
                          setEditingContest({
                            ...editingContest,
                            allowRegistration: e.target.checked,
                          })
                        }
                      />
                      <span>Allow Reg</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editingContest.isPublic !== false}
                        onChange={(e) =>
                          setEditingContest({
                            ...editingContest,
                            isPublic: e.target.checked,
                          })
                        }
                      />
                      <span>Public</span>
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={editingContest.description || ''}
                  onChange={(e) =>
                    setEditingContest({ ...editingContest, description: e.target.value })
                  }
                  className="w-full bg-slate-900 border border-slate-750 rounded p-2 text-xs text-white"
                />
              </div>

              {/* Questions Selector from Question Bank */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-medium text-slate-300">
                    Select Questions from Question Bank ({editingContest.questionIds?.length || 0} selected)
                  </label>
                  <span className="text-xs font-mono text-amber-400">
                    Total Marks:{' '}
                    {(editingContest.questionIds || []).reduce((acc: number, qId: string) => {
                      const q = questionBank.find((item) => item.id === qId);
                      return acc + (q ? q.marks : 10);
                    }, 0)}{' '}
                    pts
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto p-2 bg-slate-900/60 rounded-xl border border-slate-800">
                  {questionBank.map((q) => {
                    const isChecked = (editingContest.questionIds || []).includes(q.id);
                    return (
                      <div
                        key={q.id}
                        onClick={() => {
                          const currentIds = editingContest.questionIds || [];
                          const updated = isChecked
                            ? currentIds.filter((id: string) => id !== q.id)
                            : [...currentIds, q.id];
                          setEditingContest({ ...editingContest, questionIds: updated });
                        }}
                        className={`p-2.5 rounded-lg border text-xs cursor-pointer flex items-center justify-between transition-colors ${
                          isChecked
                            ? 'bg-amber-500/15 border-amber-500/40 text-white'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input type="checkbox" checked={isChecked} readOnly />
                          <span className="font-bold">{q.title}</span>
                        </div>
                        <div className="flex items-center gap-1.5 font-mono text-[10px]">
                          <span className="uppercase">{q.language}</span>
                          <span>&bull;</span>
                          <span className="text-amber-400">{q.marks} pts</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingContest(null)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-mono"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs font-mono"
                >
                  Save Contest
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white font-mono">Platform Contests</h3>
                  <p className="text-xs text-slate-400">
                    Manage multiple concurrent competitions with separate question pools & timers.
                  </p>
                </div>

                <button
                  onClick={() =>
                    setEditingContest({
                      id: `contest-${Date.now()}`,
                      title: 'New Coding Challenge',
                      tagline: 'Code. Debug. Win.',
                      description: 'Official competition organized by Designers Domain Club.',
                      durationMinutes: 30,
                      totalMarks: 50,
                      status: 'active',
                      isPublic: true,
                      allowRegistration: true,
                      questionIds: questionBank.slice(0, 3).map((q) => q.id),
                    })
                  }
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold font-mono"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Contest</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {contests.map((c) => (
                  <div
                    key={c.id}
                    className="p-5 rounded-2xl bg-[#0e111a] border border-slate-800 space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                            c.status === 'active'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {c.status}
                        </span>
                        <span className="text-xs font-mono font-bold text-amber-400">
                          {c.durationMinutes} Mins &bull; {c.totalMarks || 50} pts
                        </span>
                      </div>

                      <h4 className="font-bold text-white text-base">{c.title}</h4>
                      {c.tagline && <p className="text-xs font-mono text-slate-400">{c.tagline}</p>}
                      <p className="text-xs text-slate-400 line-clamp-2">{c.description}</p>

                      <div className="pt-2 text-xs font-mono text-slate-500 flex items-center gap-3">
                        <span>{c.questionIds?.length || 0} Questions</span>
                        <span>&bull;</span>
                        <span>{c.participantCount || 0} Participants</span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                      <button
                        onClick={() => {
                          setSelectedContestId(c.id);
                          setActiveTab('participants');
                          handleContestChange(c.id);
                        }}
                        className="text-xs font-mono text-amber-400 hover:underline flex items-center gap-1"
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>Manage Live</span>
                      </button>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleDuplicateContest(c)}
                          className="p-1.5 text-slate-400 hover:text-sky-400 rounded hover:bg-slate-800"
                          title="Duplicate Contest"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setEditingContest(JSON.parse(JSON.stringify(c)))}
                          className="p-1.5 text-slate-400 hover:text-amber-400 rounded hover:bg-slate-800"
                          title="Edit Contest"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        {c.id !== 'breach-the-bug-2026' && (
                          <button
                            onClick={() => handleDeleteContest(c.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-800"
                            title="Delete Contest"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- TAB 2: QUESTION BANK --- */}
      {activeTab === 'questions' && (
        <div className="space-y-6 text-left">
          {editingQuestion ? (
            /* Question Creator & Editor Form */
            <form
              onSubmit={handleSaveQuestion}
              className="bg-[#0e111a] border border-slate-800 rounded-2xl p-6 space-y-5"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white font-mono">
                  {editingQuestion.id
                    ? `Edit Question: ${editingQuestion.title}`
                    : 'Add Question to Question Bank'}
                </h3>
                <button
                  type="button"
                  onClick={() => setEditingQuestion(null)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Question ID <span className="text-amber-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editingQuestion.id || ''}
                    onChange={(e) =>
                      setEditingQuestion({ ...editingQuestion, id: e.target.value })
                    }
                    className="w-full bg-slate-900 border border-slate-750 rounded p-2 text-xs font-mono text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Problem Title <span className="text-amber-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editingQuestion.title || ''}
                    onChange={(e) =>
                      setEditingQuestion({ ...editingQuestion, title: e.target.value })
                    }
                    className="w-full bg-slate-900 border border-slate-750 rounded p-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Language</label>
                  <select
                    value={editingQuestion.language || 'python'}
                    onChange={(e) =>
                      setEditingQuestion({ ...editingQuestion, language: e.target.value })
                    }
                    className="w-full bg-slate-900 border border-slate-750 rounded p-2 text-xs text-white"
                  >
                    <option value="python">Python 3</option>
                    <option value="c">C (GCC)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Problem Statement
                </label>
                <textarea
                  rows={4}
                  value={editingQuestion.problemStatement || ''}
                  onChange={(e) =>
                    setEditingQuestion({ ...editingQuestion, problemStatement: e.target.value })
                  }
                  className="w-full bg-slate-900 border border-slate-750 rounded p-2 text-xs text-white font-mono"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Input Format</label>
                  <textarea
                    rows={2}
                    value={editingQuestion.inputFormat || ''}
                    onChange={(e) =>
                      setEditingQuestion({ ...editingQuestion, inputFormat: e.target.value })
                    }
                    className="w-full bg-slate-900 border border-slate-750 rounded p-2 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Output Format
                  </label>
                  <textarea
                    rows={2}
                    value={editingQuestion.outputFormat || ''}
                    onChange={(e) =>
                      setEditingQuestion({ ...editingQuestion, outputFormat: e.target.value })
                    }
                    className="w-full bg-slate-900 border border-slate-750 rounded p-2 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Constraints</label>
                  <textarea
                    rows={2}
                    value={editingQuestion.constraints || ''}
                    onChange={(e) =>
                      setEditingQuestion({ ...editingQuestion, constraints: e.target.value })
                    }
                    className="w-full bg-slate-900 border border-slate-750 rounded p-2 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Starter Buggy Code (Preloaded in Participant Editor)
                </label>
                <div className="h-44 border border-slate-800 rounded-lg overflow-hidden">
                  <Editor
                    height="100%"
                    language={editingQuestion.language === 'python' ? 'python' : 'c'}
                    value={editingQuestion.starterCode || ''}
                    theme="vs-dark"
                    onChange={(val) =>
                      setEditingQuestion({ ...editingQuestion, starterCode: val || '' })
                    }
                    options={{ fontSize: 12, minimap: { enabled: false } }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingQuestion(null)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-mono"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs font-mono"
                >
                  Save to Question Bank
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white font-mono">Central Question Bank</h3>
                  <p className="text-xs text-slate-400">
                    Reusable questions library. Assign any question into multiple competitions.
                  </p>
                </div>
                <button
                  onClick={() =>
                    setEditingQuestion({
                      id: `qb-q${questionBank.length + 1}`,
                      title: 'New Debugging Challenge',
                      description: 'Identify logic flaws and edge cases.',
                      problemStatement: 'Given an input stream, fix the faulty algorithm...',
                      inputFormat: 'Integer N followed by N items.',
                      outputFormat: 'Single line integer result.',
                      constraints: '1 <= N <= 10^5',
                      language: 'python',
                      starterCode: '# Fix the buggy logic below\n',
                      marks: 10,
                      timeLimitMs: 2000,
                      sampleTestCases: [
                        { id: 's1', input: '1\n', expectedOutput: '1', isSample: true, marks: 0 },
                      ],
                      hiddenTestCases: [
                        { id: 'h1', input: '2\n', expectedOutput: '2', isSample: false, marks: 10 },
                      ],
                    })
                  }
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold font-mono"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Question</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {questionBank.map((q) => (
                  <div
                    key={q.id}
                    className="p-4 rounded-xl bg-[#0e111a] border border-slate-800 space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-sm font-mono">{q.title}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-amber-400 border border-slate-700">
                          {q.marks} pts &bull; {q.language === 'python' ? 'Python' : 'C'}
                        </span>
                      </div>

                      <p className="text-xs text-slate-400 line-clamp-2">{q.description}</p>
                    </div>

                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                      <span className="text-[11px] text-slate-500 font-mono">
                        {q.sampleTestCases?.length || 0} samples &bull; {q.hiddenTestCases?.length || 0} hidden
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setEditingQuestion(JSON.parse(JSON.stringify(q)))}
                          className="p-1 text-slate-400 hover:text-amber-400"
                          title="Edit Question"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteQuestion(q.id)}
                          className="p-1 text-slate-400 hover:text-rose-400"
                          title="Delete Question"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- TAB 3: PARTICIPANTS & TIMERS --- */}
      {activeTab === 'participants' && (
        <div className="bg-[#0e111a] border border-slate-800 rounded-2xl overflow-hidden shadow-xl text-left">
          {/* Contest Selector Bar */}
          <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono font-bold text-slate-400 uppercase">
                Filter by Contest:
              </span>
              <select
                value={selectedContestId}
                onChange={(e) => handleContestChange(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-amber-400 text-xs font-mono font-bold rounded-lg px-3 py-1.5 outline-none"
              >
                {contests.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => handleContestChange(selectedContestId)}
              className="text-xs font-mono text-amber-400 hover:underline"
            >
              Refresh Table
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#090b10] border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Participant</th>
                  <th className="py-3 px-4">Reg No / Dept</th>
                  <th className="py-3 px-4 text-center">Score</th>
                  <th className="py-3 px-4 text-center">Solved</th>
                  <th className="py-3 px-4 text-right">Time</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {participants.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500 font-mono">
                      No participants registered in this contest yet.
                    </td>
                  </tr>
                ) : (
                  participants.map((p) => (
                    <tr key={p.participantId} className="hover:bg-slate-900/60">
                      <td className="py-3 px-4">
                        <div className="font-bold text-white">{p.name}</div>
                        <div className="text-[10px] text-slate-400">{p.participantId}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        <div>{p.registerNumber}</div>
                        <div className="text-[10px] text-slate-500">{p.department}</div>
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-amber-400">
                        {p.totalScore}
                      </td>
                      <td className="py-3 px-4 text-center text-emerald-400 font-bold">
                        {p.solvedCount} / {p.totalQuestions}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-300 font-bold">
                        {p.timeDisplay}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            p.status === 'completed'
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : p.status === 'disqualified'
                              ? 'bg-rose-500/10 text-rose-400'
                              : 'bg-amber-500/10 text-amber-400'
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleParticipantAction(p.participantId, 'reset_timer')}
                            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded text-[10px]"
                            title="Reset Timer to Contest Duration"
                          >
                            Reset Timer
                          </button>
                          <button
                            onClick={() => handleParticipantAction(p.participantId, 'add_time_5m')}
                            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-sky-300 rounded text-[10px]"
                            title="Grant +5 Minutes Extra Time"
                          >
                            +5m
                          </button>
                          <button
                            onClick={() => handleParticipantAction(p.participantId, 'finish')}
                            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-300 rounded text-[10px]"
                            title="Force Complete"
                          >
                            Finish
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- TAB 4: SUBMISSIONS STREAM --- */}
      {activeTab === 'submissions' && (
        <div className="bg-[#0e111a] border border-slate-800 rounded-2xl overflow-hidden shadow-xl text-left">
          <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono font-bold text-slate-400 uppercase">
                Filter by Contest:
              </span>
              <select
                value={selectedContestId}
                onChange={(e) => handleContestChange(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-amber-400 text-xs font-mono font-bold rounded-lg px-3 py-1.5 outline-none"
              >
                {contests.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>

            <span className="text-xs font-mono text-slate-400">
              {submissions.length} Submissions Logged
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#090b10] border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Time</th>
                  <th className="py-3 px-4">Participant</th>
                  <th className="py-3 px-4">Challenge</th>
                  <th className="py-3 px-4 text-center">Language</th>
                  <th className="py-3 px-4 text-center">Tests Passed</th>
                  <th className="py-3 px-4 text-center">Score</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {submissions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500 font-mono">
                      No submissions recorded in this contest yet.
                    </td>
                  </tr>
                ) : (
                  submissions.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-900/60">
                      <td className="py-3 px-4 text-slate-400">
                        {new Date(s.submittedAt).toLocaleTimeString()}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-white">{s.participantName}</div>
                        <div className="text-[10px] text-slate-500">{s.participantId}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-200">{s.questionTitle}</td>
                      <td className="py-3 px-4 text-center uppercase font-bold text-slate-400">
                        {s.language}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-slate-200">
                        {s.testsPassed} / {s.totalTests}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-amber-400">
                        {s.score} pts
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            s.status === 'Accepted'
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : 'bg-rose-500/10 text-rose-400'
                          }`}
                        >
                          {s.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
