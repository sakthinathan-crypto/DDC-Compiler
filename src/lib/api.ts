import {
  Contest,
  FullQuestion,
  LeaderboardEntry,
  Participant,
  ParticipantAccount,
  ParticipantResult,
  Question,
  RunResult,
  Submission,
  SupportedLanguage,
} from '../types';

export const api = {
  // Participant Authentication
  async participantRegister(data: {
    name: string;
    registerNumber: string;
    mobile: string;
    email: string;
    department: string;
    year: string;
    college: string;
    password?: string;
  }): Promise<{ success: boolean; account: ParticipantAccount; token: string }> {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Account registration failed');
    return json;
  },

  async participantLogin(
    identifier: string,
    password: string
  ): Promise<{ success: boolean; account: ParticipantAccount; token: string }> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password }),
    });
    const json = await res.json();
    if (!res.ok) {
      const err: any = new Error(json.error || 'Login failed');
      err.code = json.code;
      throw err;
    }
    return json;
  },

  async getParticipantProfile(participantId: string): Promise<ParticipantAccount> {
    const res = await fetch(`/api/me/profile?participantId=${encodeURIComponent(participantId)}`, {
      headers: { 'x-participant-id': participantId },
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to fetch profile');
    return json;
  },

  async updateParticipantProfile(
    participantId: string,
    data: {
      name?: string;
      mobile?: string;
      department?: string;
      year?: string;
      college?: string;
    }
  ): Promise<ParticipantAccount> {
    const res = await fetch('/api/me/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-participant-id': participantId,
      },
      body: JSON.stringify({ participantId, ...data }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to update profile');
    return json.account;
  },

  async getParticipantResults(participantId: string): Promise<ParticipantResult[]> {
    const res = await fetch(`/api/me/results?participantId=${encodeURIComponent(participantId)}`, {
      headers: { 'x-participant-id': participantId },
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to fetch results');
    return json;
  },

  async joinContest(
    contestId: string,
    participantId: string
  ): Promise<{
    participant: Participant;
    isNew: boolean;
    timeRemainingSeconds: number;
  }> {
    const res = await fetch(`/api/contests/${contestId}/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-participant-id': participantId,
      },
      body: JSON.stringify({ participantId }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to join contest');
    return json;
  },

  // Public Contests & Catalog
  async getContests(): Promise<Contest[]> {
    const res = await fetch('/api/contests');
    if (!res.ok) throw new Error('Failed to fetch contests');
    return res.json();
  },

  async getContest(id: string): Promise<Contest> {
    const res = await fetch(`/api/contests/${id}`);
    if (!res.ok) throw new Error('Failed to fetch contest');
    return res.json();
  },

  async getContestQuestions(contestId: string): Promise<Question[]> {
    const res = await fetch(`/api/contests/${contestId}/questions`);
    if (!res.ok) throw new Error('Failed to fetch contest questions');
    return res.json();
  },

  async getQuestions(contestId: string = 'breach-the-bug-2026'): Promise<Question[]> {
    return this.getContestQuestions(contestId);
  },

  async getContestQuestion(contestId: string, qId: string): Promise<Question> {
    const res = await fetch(`/api/contests/${contestId}/questions/${qId}`);
    if (!res.ok) throw new Error('Failed to fetch question');
    return res.json();
  },

  // Participant Registration & Verification (Direct contest form)
  async registerParticipant(
    contestId: string,
    data: {
      name: string;
      registerNumber: string;
      department: string;
      year: string;
      email: string;
      participantId: string;
    }
  ): Promise<{
    participant: Participant;
    isNew: boolean;
    timeRemainingSeconds: number;
  }> {
    const res = await fetch(`/api/contests/${contestId}/participants/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Registration failed');
    return json;
  },

  async getParticipant(
    contestId: string,
    id: string
  ): Promise<{
    participant: Participant;
    timeRemainingSeconds: number;
  }> {
    const res = await fetch(`/api/contests/${contestId}/participants/${id}`);
    if (!res.ok) throw new Error('Failed to fetch participant status');
    return res.json();
  },

  // Code Runner (Sample Tests & Custom Input)
  async runCode(data: {
    language: SupportedLanguage;
    code: string;
    contestId?: string;
    questionId?: string;
    customInput?: string;
  }): Promise<RunResult> {
    const res = await fetch('/api/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Run execution failed');
    return json;
  },

  // Submission against hidden tests
  async submitCode(
    contestId: string,
    data: {
      participantId: string;
      questionId: string;
      language: SupportedLanguage;
      code: string;
    }
  ): Promise<{
    submission: Submission;
    participant: Participant;
    timeRemainingSeconds: number;
  }> {
    const res = await fetch(`/api/contests/${contestId}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Submission failed');
    return json;
  },

  // Leaderboard & Submissions
  async getLeaderboard(contestId: string = 'breach-the-bug-2026'): Promise<LeaderboardEntry[]> {
    const res = await fetch(`/api/contests/${contestId}/leaderboard`);
    if (!res.ok) throw new Error('Failed to fetch leaderboard');
    return res.json();
  },

  // Real-time SSE Leaderboard subscription
  subscribeLeaderboard(
    contestId: string,
    callback: (data: LeaderboardEntry[]) => void
  ): () => void {
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/events');

      const handleEvent = (e: MessageEvent) => {
        try {
          const parsed = JSON.parse(e.data);
          callback(parsed);
        } catch (_) {}
      };

      // Listen for contest-specific event and generic event
      eventSource.addEventListener(`leaderboard_updated_${contestId}`, handleEvent);
      eventSource.addEventListener('leaderboard_updated', handleEvent);
    } catch (_) {}

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  },

  // Real-time SSE Contests subscription
  subscribeContests(callback: (contests: Contest[]) => void): () => void {
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/events');
      const handleEvent = (e: MessageEvent) => {
        try {
          const parsed = JSON.parse(e.data);
          callback(parsed);
        } catch (_) {}
      };
      eventSource.addEventListener('contests_updated', handleEvent);
    } catch (_) {}

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  },

  async getSubmissions(
    contestId?: string,
    participantId?: string,
    questionId?: string
  ): Promise<Submission[]> {
    const params = new URLSearchParams();
    if (contestId) params.append('contestId', contestId);
    if (participantId) params.append('participantId', participantId);
    if (questionId) params.append('questionId', questionId);
    const res = await fetch(`/api/submissions?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch submissions');
    return res.json();
  },

  // Admin APIs
  async adminAuth(password: string): Promise<{ success: boolean; token: string }> {
    const res = await fetch('/api/admin/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Admin authentication failed');
    return json;
  },

  // Admin Contests
  async getAdminContests(): Promise<Contest[]> {
    const res = await fetch('/api/admin/contests');
    if (!res.ok) throw new Error('Failed to fetch admin contests');
    return res.json();
  },

  async saveAdminContest(contest: Contest): Promise<{ success: boolean; contest: Contest }> {
    const res = await fetch('/api/admin/contests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(contest),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to save contest');
    return json;
  },

  async deleteAdminContest(id: string): Promise<void> {
    const res = await fetch(`/api/admin/contests/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete contest');
  },

  async duplicateAdminContest(id: string): Promise<Contest> {
    const res = await fetch(`/api/admin/contests/${id}/duplicate`, {
      method: 'POST',
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to duplicate contest');
    return json.contest;
  },

  async publishAdminContest(id: string): Promise<Contest> {
    const res = await fetch(`/api/admin/contests/${id}/publish`, {
      method: 'POST',
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to publish contest');
    return json.contest;
  },

  // Admin Question Bank
  async getAdminQuestionBank(): Promise<FullQuestion[]> {
    const res = await fetch('/api/admin/question-bank');
    if (!res.ok) throw new Error('Failed to fetch question bank');
    return res.json();
  },

  async saveAdminQuestion(question: FullQuestion): Promise<{ success: boolean; question: FullQuestion }> {
    const res = await fetch('/api/admin/question-bank', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(question),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to save question');
    return json;
  },

  async deleteAdminQuestion(id: string): Promise<void> {
    const res = await fetch(`/api/admin/question-bank/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete question');
  },

  // Admin Participants & Actions
  async getAdminParticipants(contestId: string): Promise<Participant[]> {
    const res = await fetch(`/api/admin/contests/${contestId}/participants`);
    if (!res.ok) throw new Error('Failed to fetch participants');
    return res.json();
  },

  async participantAction(
    contestId: string,
    participantId: string,
    action: string,
    addMinutes?: number
  ): Promise<void> {
    const res = await fetch(`/api/admin/contests/${contestId}/participants/${participantId}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, addMinutes }),
    });
    if (!res.ok) throw new Error('Failed to perform action');
  },
};
