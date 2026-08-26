import * as fs from 'fs';
import * as path from 'path';
import {
  Contest,
  FullQuestion,
  LeaderboardEntry,
  Participant,
  ParticipantAccount,
  ParticipantResult,
  Question,
  Submission,
} from '../src/types';
import { INITIAL_CONTESTS, INITIAL_QUESTION_BANK } from './questionsData';

export interface StoredAccount extends ParticipantAccount {
  password?: string;
}

export class PlatformStore {
  private contests: Map<string, Contest> = new Map();
  private questionBank: Map<string, FullQuestion> = new Map();
  private participants: Map<string, Participant> = new Map(); // key: `${contestId}:${participantId}`
  private accounts: Map<string, StoredAccount> = new Map(); // key: participantId
  private submissions: Submission[] = [];
  private sseClients: Set<(data: string) => void> = new Set();
  private dataFilePath: string;

  constructor() {
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      try {
        fs.mkdirSync(dataDir, { recursive: true });
      } catch (_) {}
    }
    this.dataFilePath = path.join(dataDir, 'platform_store.json');

    // Load initial production bank and contests
    INITIAL_QUESTION_BANK.forEach((q) => this.questionBank.set(q.id, JSON.parse(JSON.stringify(q))));
    INITIAL_CONTESTS.forEach((c) => this.contests.set(c.id, JSON.parse(JSON.stringify(c))));

    this.loadFromDisk();
    this.cleanupFakeData();
    this.saveToDisk();
  }

  private loadFromDisk() {
    try {
      if (fs.existsSync(this.dataFilePath)) {
        const raw = fs.readFileSync(this.dataFilePath, 'utf8');
        const parsed = JSON.parse(raw);

        // Merge question bank
        if (parsed.questionBank && typeof parsed.questionBank === 'object') {
          for (const [id, q] of Object.entries(parsed.questionBank)) {
            // Keep custom admin questions, but ensure official questions are updated
            if (!this.questionBank.has(id)) {
              this.questionBank.set(id, q as FullQuestion);
            }
          }
        }

        // Merge contests
        if (parsed.contests && typeof parsed.contests === 'object') {
          for (const [id, c] of Object.entries(parsed.contests)) {
            // Don't restore deprecated demo contests
            if (id === 'breach-the-bug-2026' || id === 'code-clash-2026' || id === 'debug-arena') {
              continue;
            }
            if (!this.contests.has(id)) {
              this.contests.set(id, c as Contest);
            }
          }
        }

        if (parsed.participants && typeof parsed.participants === 'object') {
          this.participants = new Map(Object.entries(parsed.participants));
        }

        if (parsed.accounts && typeof parsed.accounts === 'object') {
          this.accounts = new Map(Object.entries(parsed.accounts));
        }

        if (Array.isArray(parsed.submissions)) {
          this.submissions = parsed.submissions;
        }
      }
    } catch (e) {
      console.warn('Could not load store from disk, keeping production defaults:', e);
    }
  }

  private cleanupFakeData() {
    // 1. Remove demo accounts (acc_101, acc_102, DDC-2026-101, DDC-2026-102)
    const demoAccountIds = new Set(['acc_101', 'acc_102', 'DDC-2026-101', 'DDC-2026-102']);
    for (const [pId, acc] of Array.from(this.accounts.entries())) {
      if (demoAccountIds.has(acc.id) || demoAccountIds.has(pId) || acc.email?.endsWith('@college.edu')) {
        this.accounts.delete(pId);
      }
    }

    // 2. Remove fake demo participants
    for (const [key, part] of Array.from(this.participants.entries())) {
      if (
        demoAccountIds.has(part.id) ||
        demoAccountIds.has(part.participantId) ||
        part.email?.endsWith('@college.edu') ||
        part.contestId === 'breach-the-bug-2026' ||
        part.contestId === 'code-clash-2026'
      ) {
        this.participants.delete(key);
      }
    }

    // 3. Remove submissions from fake demo participants
    this.submissions = this.submissions.filter((s) => !demoAccountIds.has(s.participantId));
  }

  private saveToDisk() {
    try {
      const data = {
        questionBank: Object.fromEntries(this.questionBank),
        contests: Object.fromEntries(this.contests),
        participants: Object.fromEntries(this.participants),
        accounts: Object.fromEntries(this.accounts),
        submissions: this.submissions,
      };
      fs.writeFileSync(this.dataFilePath, JSON.stringify(data, null, 2), 'utf8');
    } catch (e) {
      console.error('Failed to persist platform store to disk:', e);
    }
  }

  // SSE Subscriptions
  public subscribeSSE(sendFn: (data: string) => void) {
    this.sseClients.add(sendFn);
    return () => {
      this.sseClients.delete(sendFn);
    };
  }

  public broadcast(event: string, payload: any) {
    const message = `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
    for (const sendFn of this.sseClients) {
      try {
        sendFn(message);
      } catch (_) {}
    }
  }

  // ================= CONTESTS API ================= //
  public getAllContests(): Contest[] {
    return Array.from(this.contests.values())
      .map((c) => {
        const pCount = Array.from(this.participants.values()).filter(
          (p) => p.contestId === c.id
        ).length;
        const sCount = this.submissions.filter((s) => s.contestId === c.id).length;
        const totalMarks = this.calculateContestTotalMarks(c);
        return {
          ...c,
          totalQuestions: c.questionIds.length,
          totalMarks,
          participantCount: pCount,
          submissionCount: sCount,
        };
      })
      .sort((a, b) => a.title.localeCompare(b.title));
  }

  public getPublicContests(): Contest[] {
    return this.getAllContests().filter((c) => c.isPublic && c.status !== 'draft');
  }

  public getContest(id: string): Contest | undefined {
    const c = this.contests.get(id);
    if (!c) return undefined;
    const pCount = Array.from(this.participants.values()).filter(
      (p) => p.contestId === c.id
    ).length;
    const sCount = this.submissions.filter((s) => s.contestId === c.id).length;
    const totalMarks = this.calculateContestTotalMarks(c);
    return {
      ...c,
      totalQuestions: c.questionIds.length,
      totalMarks,
      participantCount: pCount,
      submissionCount: sCount,
    };
  }

  private calculateContestTotalMarks(contest: Contest): number {
    let total = 0;
    for (const qId of contest.questionIds) {
      if (contest.customQuestionMarks && contest.customQuestionMarks[qId] !== undefined) {
        total += contest.customQuestionMarks[qId];
      } else {
        const q = this.questionBank.get(qId);
        if (q) total += q.marks;
      }
    }
    return total;
  }

  public saveContest(contestData: Contest): Contest {
    const existing = this.contests.get(contestData.id);
    const updated: Contest = {
      ...contestData,
      totalQuestions: contestData.questionIds?.length || 0,
      totalMarks: this.calculateContestTotalMarks(contestData),
      createdAt: existing ? existing.createdAt : Date.now(),
      updatedAt: Date.now(),
    };
    this.contests.set(updated.id, updated);
    this.saveToDisk();
    this.broadcast('contests_updated', this.getPublicContests());
    return updated;
  }

  public deleteContest(id: string): boolean {
    const removed = this.contests.delete(id);
    if (removed) {
      this.saveToDisk();
      this.broadcast('contests_updated', this.getPublicContests());
    }
    return removed;
  }

  public duplicateContest(id: string): Contest | undefined {
    const orig = this.contests.get(id);
    if (!orig) return undefined;
    const newId = `${orig.id}-copy-${Date.now().toString(36)}`;
    const copy: Contest = {
      ...JSON.parse(JSON.stringify(orig)),
      id: newId,
      title: `${orig.title} (Copy)`,
      status: 'draft',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    this.contests.set(newId, copy);
    this.saveToDisk();
    this.broadcast('contests_updated', this.getPublicContests());
    return copy;
  }

  public publishContest(id: string): Contest | undefined {
    const contest = this.contests.get(id);
    if (!contest) return undefined;

    // Take immutable snapshots of all current questions from bank
    const snapshots: { [qId: string]: FullQuestion } = {};
    for (const qId of contest.questionIds) {
      const q = this.questionBank.get(qId);
      if (q) {
        snapshots[qId] = JSON.parse(JSON.stringify(q));
      }
    }

    contest.status = 'active';
    contest.questionSnapshots = snapshots;
    contest.updatedAt = Date.now();
    this.contests.set(id, contest);
    this.saveToDisk();
    this.broadcast('contests_updated', this.getPublicContests());
    return contest;
  }

  // ================= QUESTION BANK API ================= //
  public getAllBankQuestions(): FullQuestion[] {
    return Array.from(this.questionBank.values()).sort(
      (a, b) => a.id.localeCompare(b.id)
    );
  }

  public getBankQuestion(id: string): FullQuestion | undefined {
    return this.questionBank.get(id);
  }

  public saveBankQuestion(questionData: FullQuestion): FullQuestion {
    const existing = this.questionBank.get(questionData.id);
    const updated: FullQuestion = {
      ...questionData,
      createdAt: existing ? existing.createdAt : Date.now(),
      updatedAt: Date.now(),
    };
    this.questionBank.set(updated.id, updated);
    this.saveToDisk();
    this.broadcast('question_bank_updated', Array.from(this.questionBank.values()));
    return updated;
  }

  public deleteBankQuestion(id: string): boolean {
    const removed = this.questionBank.delete(id);
    if (removed) {
      this.saveToDisk();
      this.broadcast('question_bank_updated', Array.from(this.questionBank.values()));
    }
    return removed;
  }

  // ================= CONTEST SPECIFIC QUESTIONS ================= //
  // Returns safe questions without hidden test cases for participant
  public getContestPublicQuestions(contestId: string): Question[] {
    const contest = this.contests.get(contestId);
    if (!contest) return [];

    const result: Question[] = [];
    for (let i = 0; i < contest.questionIds.length; i++) {
      const qId = contest.questionIds[i];
      // Prefer question snapshot if available for published contest
      const fullQ = contest.questionSnapshots?.[qId] || this.questionBank.get(qId);
      if (fullQ) {
        const { hiddenTestCases, ...safeQ } = fullQ;
        const customMark = contest.customQuestionMarks?.[qId];
        result.push({
          ...safeQ,
          marks: customMark !== undefined ? customMark : safeQ.marks,
        });
      }
    }
    return result;
  }

  public getContestFullQuestion(contestId: string, questionId: string): FullQuestion | undefined {
    const contest = this.contests.get(contestId);
    if (!contest) return undefined;
    const fullQ = contest.questionSnapshots?.[questionId] || this.questionBank.get(questionId);
    if (!fullQ) return undefined;
    const customMark = contest.customQuestionMarks?.[questionId];
    return {
      ...fullQ,
      marks: customMark !== undefined ? customMark : fullQ.marks,
    };
  }

  public getContestFullQuestions(contestId: string): FullQuestion[] {
    const contest = this.contests.get(contestId);
    if (!contest) return [];
    return contest.questionIds
      .map((qId) => this.getContestFullQuestion(contestId, qId))
      .filter((q): q is FullQuestion => !!q);
  }

  // ================= PARTICIPANT SESSIONS ================= //
  public registerParticipant(
    contestId: string,
    data: {
      name: string;
      registerNumber: string;
      department: string;
      year: string;
      email: string;
      participantId: string;
    }
  ): { participant: Participant; isNew: boolean } {
    const contest = this.contests.get(contestId);
    if (!contest) {
      throw new Error(`Contest "${contestId}" not found.`);
    }

    if (!contest.allowRegistration && contest.status !== 'active') {
      throw new Error(`Registration for contest "${contest.title}" is currently closed.`);
    }

    const trimmedId = data.participantId.trim();
    const key = `${contestId}:${trimmedId}`;
    const existing = this.participants.get(key);

    if (existing) {
      // Allow resuming if register number or email matches
      if (
        existing.registerNumber.toLowerCase() === data.registerNumber.trim().toLowerCase() ||
        existing.email.toLowerCase() === data.email.trim().toLowerCase()
      ) {
        return { participant: existing, isNew: false };
      }
      throw new Error(
        `Participant ID "${trimmedId}" is already registered in this contest with different details.`
      );
    }

    // Check duplicate register number or email in this contest
    for (const p of this.participants.values()) {
      if (p.contestId === contestId) {
        if (p.registerNumber.toLowerCase() === data.registerNumber.trim().toLowerCase()) {
          throw new Error(
            `Register Number "${data.registerNumber}" is already registered in this contest as ID ${p.participantId}.`
          );
        }
        if (p.email.toLowerCase() === data.email.trim().toLowerCase()) {
          throw new Error(
            `Email "${data.email}" is already registered in this contest as ID ${p.participantId}.`
          );
        }
      }
    }

    const now = Date.now();
    const newParticipant: Participant = {
      id: `p_${contestId}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      contestId,
      participantId: trimmedId,
      name: data.name.trim(),
      registerNumber: data.registerNumber.trim(),
      department: data.department.trim(),
      year: data.year.trim(),
      email: data.email.trim().toLowerCase(),
      createdAt: now,
      startTime: now,
      status: 'active',
      totalScore: 0,
      solvedCount: 0,
      completionTimeSeconds: 0,
    };

    this.participants.set(key, newParticipant);
    this.saveToDisk();
    this.broadcast(`leaderboard_updated_${contestId}`, this.getContestLeaderboard(contestId));
    this.broadcast('participant_registered', { contestId, participant: newParticipant });
    return { participant: newParticipant, isNew: true };
  }

  public getParticipant(contestId: string, participantId: string): Participant | undefined {
    return this.participants.get(`${contestId}:${participantId.trim()}`);
  }

  public getAllParticipants(contestId?: string): Participant[] {
    const all = Array.from(this.participants.values());
    if (contestId) {
      return all.filter((p) => p.contestId === contestId);
    }
    return all;
  }

  public updateParticipant(contestId: string, participantId: string, patch: Partial<Participant>) {
    const key = `${contestId}:${participantId.trim()}`;
    const p = this.participants.get(key);
    if (!p) return undefined;
    const updated = { ...p, ...patch };
    this.participants.set(key, updated);
    this.saveToDisk();
    this.broadcast(`leaderboard_updated_${contestId}`, this.getContestLeaderboard(contestId));
    return updated;
  }

  public getParticipantTimeRemainingSeconds(contestId: string, participantId: string): number {
    const p = this.getParticipant(contestId, participantId);
    if (!p) return 0;
    if (p.status === 'completed') return 0;

    const contest = this.contests.get(contestId);
    const durationMinutes = contest ? contest.durationMinutes : 45;
    const maxDurationSec = durationMinutes * 60;
    const elapsedSec = Math.floor((Date.now() - p.startTime) / 1000);
    const remaining = maxDurationSec - elapsedSec;

    if (remaining <= 0) {
      if (p.status === 'active') {
        p.status = 'completed';
        p.endTime = p.startTime + maxDurationSec * 1000;
        p.completionTimeSeconds = maxDurationSec;
        this.saveToDisk();
        this.broadcast(`leaderboard_updated_${contestId}`, this.getContestLeaderboard(contestId));
      }
      return 0;
    }
    return remaining;
  }

  // ================= SUBMISSIONS & SCORING ================= //
  public addSubmission(submission: Submission) {
    this.submissions.unshift(submission);

    const participant = this.getParticipant(submission.contestId, submission.participantId);
    const contest = this.contests.get(submission.contestId);

    if (participant && contest) {
      const contestQuestions = this.getContestFullQuestions(submission.contestId);
      const partSubs = this.submissions.filter(
        (s) => s.contestId === submission.contestId && s.participantId === participant.participantId
      );

      const questionBestScores = new Map<string, number>();
      let solved = 0;
      let lastAcceptedTime = participant.startTime;

      for (const q of contestQuestions) {
        const qSubs = partSubs.filter((s) => s.questionId === q.id);
        if (qSubs.length > 0) {
          const maxScore = Math.max(...qSubs.map((s) => s.score));
          questionBestScores.set(q.id, maxScore);
          if (maxScore >= q.marks) {
            solved++;
            const firstAccepted = qSubs.find((s) => s.score >= q.marks);
            if (firstAccepted && firstAccepted.submittedAt > lastAcceptedTime) {
              lastAcceptedTime = firstAccepted.submittedAt;
            }
          }
        } else {
          questionBestScores.set(q.id, 0);
        }
      }

      let totalScore = 0;
      for (const score of questionBestScores.values()) {
        totalScore += score;
      }

      participant.totalScore = totalScore;
      participant.solvedCount = solved;

      const timeTakenSec = Math.max(0, Math.floor((lastAcceptedTime - participant.startTime) / 1000));
      participant.completionTimeSeconds = timeTakenSec;

      if (solved >= contestQuestions.length && contestQuestions.length > 0 && participant.status === 'active') {
        participant.status = 'completed';
        participant.endTime = lastAcceptedTime;
      }

      this.saveToDisk();
    }

    this.broadcast(`new_submission_${submission.contestId}`, submission);
    this.broadcast('new_submission_global', submission);
    this.broadcast(
      `leaderboard_updated_${submission.contestId}`,
      this.getContestLeaderboard(submission.contestId)
    );
  }

  public getSubmissions(
    contestId?: string,
    participantId?: string,
    questionId?: string
  ): Submission[] {
    let list = this.submissions;
    if (contestId) {
      list = list.filter((s) => s.contestId === contestId);
    }
    if (participantId) {
      list = list.filter((s) => s.participantId === participantId);
    }
    if (questionId) {
      list = list.filter((s) => s.questionId === questionId);
    }
    return list;
  }

  // ================= LEADERBOARD LOGIC ================= //
  // Strict tie-breakers:
  // 1. Total Score DESC
  // 2. Solved Count DESC
  // 3. Completion Time ASC
  // 4. Start Time ASC
  public getContestLeaderboard(contestId: string): LeaderboardEntry[] {
    const contestQuestions = this.getContestFullQuestions(contestId);
    const list = Array.from(this.participants.values()).filter(
      (p) => p.contestId === contestId && p.status !== 'disqualified'
    );

    list.sort((a, b) => {
      if (b.totalScore !== a.totalScore) {
        return b.totalScore - a.totalScore;
      }
      if (b.solvedCount !== a.solvedCount) {
        return b.solvedCount - a.solvedCount;
      }
      const timeA = a.completionTimeSeconds || 999999;
      const timeB = b.completionTimeSeconds || 999999;
      if (timeA !== timeB) {
        return timeA - timeB;
      }
      return a.startTime - b.startTime;
    });

    return list.map((p, index) => {
      const mins = Math.floor((p.completionTimeSeconds || 0) / 60);
      const secs = (p.completionTimeSeconds || 0) % 60;
      const timeDisplay = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

      const qScores: { [qId: string]: number } = {};
      const partSubs = this.submissions.filter(
        (s) => s.contestId === contestId && s.participantId === p.participantId
      );
      for (const q of contestQuestions) {
        const qSubs = partSubs.filter((s) => s.questionId === q.id);
        qScores[q.id] = qSubs.length > 0 ? Math.max(...qSubs.map((s) => s.score)) : 0;
      }

      const lastSub = partSubs[0];
      const lastSubTime = lastSub ? lastSub.submittedAt : p.startTime;

      return {
        rank: index + 1,
        contestId,
        participantId: p.participantId,
        name: p.name,
        registerNumber: p.registerNumber,
        department: p.department,
        year: p.year,
        totalScore: p.totalScore,
        solvedCount: p.solvedCount,
        totalQuestions: contestQuestions.length,
        timeDisplay,
        completionTimeSeconds: p.completionTimeSeconds || 0,
        status: p.status,
        lastSubmissionTime: lastSubTime,
        questionScores: qScores,
      };
    });
  }

  // ================= PARTICIPANT AUTHENTICATION & PROFILES ================= //
  public registerAccount(data: {
    name: string;
    registerNumber: string;
    mobile: string;
    email: string;
    department: string;
    year: string;
    college: string;
    password?: string;
  }): ParticipantAccount {
    const trimmedEmail = data.email.trim().toLowerCase();
    const trimmedReg = data.registerNumber.trim().toUpperCase();

    // Check duplicate email or register number
    for (const acc of this.accounts.values()) {
      if (acc.email.toLowerCase() === trimmedEmail) {
        throw new Error(`Email "${data.email}" is already registered. Please login or use a different email.`);
      }
      if (acc.registerNumber.toUpperCase() === trimmedReg) {
        throw new Error(`Register Number "${data.registerNumber}" is already registered.`);
      }
    }

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const participantId = `DDC-2026-${randomSuffix}`;
    const now = Date.now();

    const newAccount: StoredAccount = {
      id: `acc_${now}_${Math.random().toString(36).substring(2, 7)}`,
      participantId,
      name: data.name.trim(),
      registerNumber: trimmedReg,
      mobile: data.mobile.trim(),
      email: trimmedEmail,
      department: data.department.trim(),
      year: data.year.trim(),
      college: data.college.trim(),
      password: data.password || 'ddc2026',
      createdAt: now,
      updatedAt: now,
    };

    this.accounts.set(participantId, newAccount);
    this.saveToDisk();

    const { password, ...safeAccount } = newAccount;
    return safeAccount;
  }

  public loginAccount(identifier: string, pass: string): ParticipantAccount {
    const cleanId = identifier.trim().toLowerCase();
    let found: StoredAccount | undefined;

    for (const acc of this.accounts.values()) {
      if (
        acc.email.toLowerCase() === cleanId ||
        acc.participantId.toLowerCase() === cleanId ||
        acc.registerNumber.toLowerCase() === cleanId
      ) {
        found = acc;
        break;
      }
    }

    if (!found) {
      const err: any = new Error('Account not found. Please sign up first to participate.');
      err.code = 'ACCOUNT_NOT_FOUND';
      throw err;
    }

    if (found.password && found.password !== pass) {
      const err: any = new Error('Invalid login credentials.');
      err.code = 'INVALID_CREDENTIALS';
      throw err;
    }

    const { password, ...safeAccount } = found;
    return safeAccount;
  }

  public getAccountByParticipantId(participantId: string): ParticipantAccount | undefined {
    const acc = this.accounts.get(participantId.trim());
    if (!acc) return undefined;
    const { password, ...safeAccount } = acc;
    return safeAccount;
  }

  public updateAccount(
    participantId: string,
    patch: {
      name?: string;
      mobile?: string;
      department?: string;
      year?: string;
      college?: string;
    }
  ): ParticipantAccount {
    const acc = this.accounts.get(participantId.trim());
    if (!acc) {
      throw new Error('Account not found');
    }

    const updated: StoredAccount = {
      ...acc,
      name: patch.name ? patch.name.trim() : acc.name,
      mobile: patch.mobile ? patch.mobile.trim() : acc.mobile,
      department: patch.department ? patch.department.trim() : acc.department,
      year: patch.year ? patch.year.trim() : acc.year,
      college: patch.college ? patch.college.trim() : acc.college,
      updatedAt: Date.now(),
    };

    this.accounts.set(participantId.trim(), updated);

    // Sync across all contest participants
    for (const [key, part] of this.participants.entries()) {
      if (part.participantId === participantId) {
        this.participants.set(key, {
          ...part,
          name: updated.name,
          department: updated.department,
          year: updated.year,
          college: updated.college,
          mobile: updated.mobile,
        });
      }
    }

    this.saveToDisk();
    const { password, ...safeAccount } = updated;
    return safeAccount;
  }

  public getParticipantResults(participantId: string): ParticipantResult[] {
    const results: ParticipantResult[] = [];
    const allContests = this.getAllContests();

    for (const contest of allContests) {
      const participant = this.getParticipant(contest.id, participantId);
      if (participant) {
        const leaderboard = this.getContestLeaderboard(contest.id);
        const rankIndex = leaderboard.findIndex((l) => l.participantId === participant.participantId);
        const rank = rankIndex >= 0 ? rankIndex + 1 : 0;
        const mins = Math.floor((participant.completionTimeSeconds || 0) / 60);
        const secs = (participant.completionTimeSeconds || 0) % 60;
        const timeDisplay = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

        const partSubs = this.submissions.filter(
          (s) => s.contestId === contest.id && s.participantId === participant.participantId
        );
        const lastSub = partSubs[0];

        results.push({
          contestId: contest.id,
          contestTitle: contest.title,
          totalScore: participant.totalScore,
          totalMarks: contest.totalMarks,
          solvedCount: participant.solvedCount,
          totalQuestions: contest.totalQuestions,
          completionTimeSeconds: participant.completionTimeSeconds || 0,
          timeDisplay,
          rank,
          status: participant.status,
          lastSubmissionTime: lastSub ? lastSub.submittedAt : participant.startTime,
        });
      }
    }

    return results.sort((a, b) => (b.lastSubmissionTime || 0) - (a.lastSubmissionTime || 0));
  }

  public joinContestWithAccount(
    contestId: string,
    participantId: string
  ): { participant: Participant; isNew: boolean; timeRemainingSeconds: number } {
    const account = this.getAccountByParticipantId(participantId);
    if (!account) {
      throw new Error('Participant account not found. Please log in first.');
    }

    const regResult = this.registerParticipant(contestId, {
      name: account.name,
      registerNumber: account.registerNumber,
      department: account.department,
      year: account.year,
      email: account.email,
      participantId: account.participantId,
    });

    // Also attach college & mobile if available
    const key = `${contestId}:${account.participantId}`;
    const p = this.participants.get(key);
    if (p) {
      p.college = account.college;
      p.mobile = account.mobile;
      this.participants.set(key, p);
    }

    const timeRemainingSeconds = this.getParticipantTimeRemainingSeconds(contestId, account.participantId);

    return {
      participant: regResult.participant,
      isNew: regResult.isNew,
      timeRemainingSeconds,
    };
  }
}

export const store = new PlatformStore();
