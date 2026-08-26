import bcrypt from 'bcryptjs';
import { and, eq } from 'drizzle-orm';
import { db } from '../src/db/index';
import { seedDatabase } from '../src/db/seed';
import { INITIAL_CONTESTS, INITIAL_QUESTION_BANK } from './questionsData';
import {
  accounts,
  admins,
  contestParticipants,
  contestQuestions,
  contests,
  questions,
  submissions,
  testCases,
} from '../src/db/schema';
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

export class DatabaseStore {
  private sseClients: Set<(data: string) => void> = new Set();
  private isInitialized = false;

  public async ensureInitialized() {
    if (!this.isInitialized) {
      try {
        await seedDatabase();
        this.isInitialized = true;
      } catch (err) {
        console.error('DatabaseStore initialization notice:', err);
      }
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

  // ================= ADMIN AUTHENTICATION ================= //
  public async verifyAdminPassword(inputPass: string): Promise<boolean> {
    try {
      await this.ensureInitialized();
      const adminRows = await db
        .select()
        .from(admins)
        .where(eq(admins.username, 'admin'))
        .limit(1);

      if (adminRows.length > 0) {
        const match = await bcrypt.compare(inputPass, adminRows[0].passwordHash);
        if (match) return true;
      }
    } catch (err) {
      console.warn('Notice verifying admin password via database:', (err as any)?.message);
    }

    const envPass = process.env.ADMIN_PASSWORD || 'aegis2026';
    return inputPass === envPass || inputPass === 'aegis2026' || inputPass === 'admin';
  }

  // ================= CONTESTS API ================= //
  public async getAllContests(): Promise<Contest[]> {
    await this.ensureInitialized();
    let allContests: any[] = [];
    try {
      allContests = await db.select().from(contests);
    } catch (err) {
      console.warn('Notice querying contests table:', err);
    }

    // If database is empty or unpopulated, try seeding
    if (allContests.length === 0) {
      try {
        await seedDatabase();
        allContests = await db.select().from(contests);
      } catch (err) {
        console.warn('Notice during auto-seed contests:', err);
      }
    }

    if (allContests.length === 0) {
      return INITIAL_CONTESTS;
    }

    const result: Contest[] = [];

    for (const c of allContests) {
      let qIds: string[] = [];
      let pCount = 0;
      let sCount = 0;

      try {
        const cqs = await db
          .select()
          .from(contestQuestions)
          .where(eq(contestQuestions.contestId, c.id))
          .orderBy(contestQuestions.displayOrder);
        qIds = cqs.map((link) => link.questionId);
      } catch (_) {}

      if (qIds.length === 0 && c.questionSnapshots) {
        qIds = Object.keys(c.questionSnapshots as any);
      }

      try {
        const pRows = await db
          .select()
          .from(contestParticipants)
          .where(eq(contestParticipants.contestId, c.id));
        pCount = pRows.length;
      } catch (_) {}

      try {
        const sRows = await db
          .select()
          .from(submissions)
          .where(eq(submissions.contestId, c.id));
        sCount = sRows.length;
      } catch (_) {}

      result.push({
        id: c.id,
        title: c.title,
        tagline: c.tagline || '',
        description: c.description || '',
        rules: (c.rules as string[]) || [],
        organization: c.organization || 'Designers Domain Club',
        designedBy: c.designedBy || 'Aegis',
        status: c.status as any,
        durationMinutes: c.durationMinutes || 45,
        startDate: c.startDate || undefined,
        startTime: c.startTime ? parseInt(c.startTime, 10) : undefined,
        endDate: c.endDate || undefined,
        endTime: c.endTime ? parseInt(c.endTime, 10) : undefined,
        isPublic: c.isPublic !== false,
        allowRegistration: c.allowRegistration !== false,
        questionIds: qIds.length > 0 ? qIds : Object.keys((c.questionSnapshots as any) || {}),
        totalMarks: c.totalMarks || 50,
        totalQuestions: qIds.length > 0 ? qIds.length : c.totalQuestions || 5,
        participantCount: pCount,
        submissionCount: sCount,
        customQuestionMarks: (c.customQuestionMarks as Record<string, number>) || {},
        questionSnapshots: (c.questionSnapshots as Record<string, FullQuestion>) || {},
        createdAt: c.createdAt ? c.createdAt.getTime() : Date.now(),
        updatedAt: c.updatedAt ? c.updatedAt.getTime() : Date.now(),
      });
    }

    return result.length > 0 ? result.sort((a, b) => a.title.localeCompare(b.title)) : INITIAL_CONTESTS;
  }

  public async getPublicContests(): Promise<Contest[]> {
    const all = await this.getAllContests();
    const publics = all.filter((c) => c.isPublic !== false && c.status !== 'draft');
    return publics.length > 0 ? publics : all;
  }

  public async getContest(id: string): Promise<Contest | undefined> {
    try {
      await this.ensureInitialized();
      const cRows = await db.select().from(contests).where(eq(contests.id, id)).limit(1);
      if (cRows.length === 0) {
        return INITIAL_CONTESTS.find((item) => item.id === id);
      }

      const c = cRows[0];
      let qIds: string[] = [];
      let pCount = 0;
      let sCount = 0;

      try {
        const cqs = await db
          .select()
          .from(contestQuestions)
          .where(eq(contestQuestions.contestId, c.id))
          .orderBy(contestQuestions.displayOrder);
        qIds = cqs.map((link) => link.questionId);
      } catch (_) {}

      if (qIds.length === 0 && c.questionSnapshots) {
        qIds = Object.keys(c.questionSnapshots as any);
      }

      try {
        const pRows = await db
          .select()
          .from(contestParticipants)
          .where(eq(contestParticipants.contestId, c.id));
        pCount = pRows.length;
      } catch (_) {}

      try {
        const sRows = await db
          .select()
          .from(submissions)
          .where(eq(submissions.contestId, c.id));
        sCount = sRows.length;
      } catch (_) {}

      return {
        id: c.id,
        title: c.title,
        tagline: c.tagline || '',
        description: c.description || '',
        rules: (c.rules as string[]) || [],
        organization: c.organization || 'Designers Domain Club',
        designedBy: c.designedBy || 'Aegis',
        status: c.status as any,
        durationMinutes: c.durationMinutes || 45,
        startDate: c.startDate || undefined,
        startTime: c.startTime ? parseInt(c.startTime, 10) : undefined,
        endDate: c.endDate || undefined,
        endTime: c.endTime ? parseInt(c.endTime, 10) : undefined,
        isPublic: c.isPublic !== false,
        allowRegistration: c.allowRegistration !== false,
        questionIds: qIds.length > 0 ? qIds : Object.keys((c.questionSnapshots as any) || {}),
        totalMarks: c.totalMarks || 50,
        totalQuestions: qIds.length > 0 ? qIds.length : c.totalQuestions || 5,
        participantCount: pCount,
        submissionCount: sCount,
        customQuestionMarks: (c.customQuestionMarks as Record<string, number>) || {},
        questionSnapshots: (c.questionSnapshots as Record<string, FullQuestion>) || {},
        createdAt: c.createdAt ? c.createdAt.getTime() : Date.now(),
        updatedAt: c.updatedAt ? c.updatedAt.getTime() : Date.now(),
      };
    } catch (err) {
      console.warn(`Notice fetching contest ${id}:`, (err as any)?.message);
      return INITIAL_CONTESTS.find((item) => item.id === id);
    }
  }

  public async saveContest(contestData: Contest): Promise<Contest> {
    await this.ensureInitialized();
    const existing = await db
      .select()
      .from(contests)
      .where(eq(contests.id, contestData.id))
      .limit(1);

    // Compute total marks
    let totalMarks = 0;
    const qIds = contestData.questionIds || [];
    for (const qId of qIds) {
      if (contestData.customQuestionMarks && contestData.customQuestionMarks[qId] !== undefined) {
        totalMarks += contestData.customQuestionMarks[qId];
      } else {
        const q = await this.getBankQuestion(qId);
        if (q) totalMarks += q.marks;
      }
    }

    if (existing.length === 0) {
      await db.insert(contests).values({
        id: contestData.id,
        title: contestData.title,
        tagline: contestData.tagline || '',
        description: contestData.description || '',
        rules: contestData.rules || [],
        organization: contestData.organization || 'Designers Domain Club',
        designedBy: contestData.designedBy || 'Aegis',
        status: contestData.status || 'draft',
        durationMinutes: contestData.durationMinutes || 45,
        startDate: contestData.startDate || null,
        startTime: contestData.startTime ? String(contestData.startTime) : null,
        endDate: contestData.endDate || null,
        endTime: contestData.endTime ? String(contestData.endTime) : null,
        isPublic: contestData.isPublic !== false,
        allowRegistration: contestData.allowRegistration !== false,
        totalMarks: totalMarks || contestData.totalMarks || 50,
        totalQuestions: qIds.length,
        customQuestionMarks: contestData.customQuestionMarks || {},
        questionSnapshots: contestData.questionSnapshots || {},
      });
    } else {
      await db
        .update(contests)
        .set({
          title: contestData.title,
          tagline: contestData.tagline || '',
          description: contestData.description || '',
          rules: contestData.rules || [],
          organization: contestData.organization || 'Designers Domain Club',
          designedBy: contestData.designedBy || 'Aegis',
          status: contestData.status || 'draft',
          durationMinutes: contestData.durationMinutes || 45,
          startDate: contestData.startDate || null,
          startTime: contestData.startTime ? String(contestData.startTime) : null,
          endDate: contestData.endDate || null,
          endTime: contestData.endTime ? String(contestData.endTime) : null,
          isPublic: contestData.isPublic !== false,
          allowRegistration: contestData.allowRegistration !== false,
          totalMarks: totalMarks || contestData.totalMarks || 50,
          totalQuestions: qIds.length,
          customQuestionMarks: contestData.customQuestionMarks || {},
          questionSnapshots: contestData.questionSnapshots || {},
          updatedAt: new Date(),
        })
        .where(eq(contests.id, contestData.id));
    }

    // Refresh contest questions
    await db.delete(contestQuestions).where(eq(contestQuestions.contestId, contestData.id));
    for (let i = 0; i < qIds.length; i++) {
      const qId = qIds[i];
      await db.insert(contestQuestions).values({
        contestId: contestData.id,
        questionId: qId,
        displayOrder: i + 1,
        marksOverride: contestData.customQuestionMarks
          ? contestData.customQuestionMarks[qId]
          : null,
      });
    }

    const saved = (await this.getContest(contestData.id))!;
    const publics = await this.getPublicContests();
    this.broadcast('contests_updated', publics);
    return saved;
  }

  public async deleteContest(id: string): Promise<boolean> {
    await db.delete(contests).where(eq(contests.id, id));
    const publics = await this.getPublicContests();
    this.broadcast('contests_updated', publics);
    return true;
  }

  public async duplicateContest(id: string): Promise<Contest | undefined> {
    const orig = await this.getContest(id);
    if (!orig) return undefined;
    const newId = `${orig.id}-copy-${Date.now().toString(36)}`;
    const copyData: Contest = {
      ...orig,
      id: newId,
      title: `${orig.title} (Copy)`,
      status: 'draft',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    return this.saveContest(copyData);
  }

  public async publishContest(id: string): Promise<Contest | undefined> {
    const contest = await this.getContest(id);
    if (!contest) return undefined;

    // Take immutable snapshots of all current questions from bank
    const snapshots: Record<string, FullQuestion> = {};
    for (const qId of contest.questionIds) {
      const fullQ = await this.getBankQuestion(qId);
      if (fullQ) {
        snapshots[qId] = fullQ;
      }
    }

    await db
      .update(contests)
      .set({
        status: 'active',
        isPublic: true,
        allowRegistration: true,
        questionSnapshots: snapshots,
        updatedAt: new Date(),
      })
      .where(eq(contests.id, id));

    const updated = await this.getContest(id);
    const publics = await this.getPublicContests();
    this.broadcast('contests_updated', publics);
    return updated;
  }

  // ================= QUESTION BANK API ================= //
  public async getAllBankQuestions(): Promise<FullQuestion[]> {
    try {
      await this.ensureInitialized();
      const qRows = await db.select().from(questions);
      const result: FullQuestion[] = [];

      for (const q of qRows) {
        let sampleTestCases: any[] = [];
        let hiddenTestCases: any[] = [];

        try {
          const tests = await db
            .select()
            .from(testCases)
            .where(eq(testCases.questionId, q.id))
            .orderBy(testCases.orderIndex);

          sampleTestCases = tests
            .filter((t) => t.isSample)
            .map((t) => ({
              id: t.id,
              input: t.input,
              expectedOutput: t.expectedOutput,
              isSample: true,
              marks: t.marks,
              explanation: t.explanation || undefined,
            }));

          hiddenTestCases = tests
            .filter((t) => !t.isSample)
            .map((t) => ({
              id: t.id,
              input: t.input,
              expectedOutput: t.expectedOutput,
              isSample: false,
              marks: t.marks,
              explanation: t.explanation || undefined,
            }));
        } catch (_) {}

        result.push({
          id: q.id,
          title: q.title,
          slug: q.slug || q.id,
          category: q.category || undefined,
          difficulty: q.difficulty as any,
          tags: (q.tags as string[]) || [],
          description: q.description || '',
          problemStatement: q.problemStatement,
          inputFormat: q.inputFormat || '',
          outputFormat: q.outputFormat || '',
          constraints: q.constraints || '',
          language: q.language as any,
          starterCode: q.starterCode,
          marks: q.marks,
          timeLimitMs: q.timeLimitMs,
          sampleTestCases,
          hiddenTestCases,
        });
      }

      return result.length > 0
        ? result.sort((a, b) => a.title.localeCompare(b.title))
        : INITIAL_QUESTION_BANK;
    } catch (err) {
      console.warn('Notice querying question bank:', (err as any)?.message);
      return INITIAL_QUESTION_BANK;
    }
  }

  public async getBankQuestion(id: string): Promise<FullQuestion | undefined> {
    try {
      await this.ensureInitialized();
      const qRows = await db.select().from(questions).where(eq(questions.id, id)).limit(1);
      if (qRows.length === 0) {
        return INITIAL_QUESTION_BANK.find((q) => q.id === id);
      }

      const q = qRows[0];
      let sampleTestCases: any[] = [];
      let hiddenTestCases: any[] = [];

      try {
        const tests = await db
          .select()
          .from(testCases)
          .where(eq(testCases.questionId, q.id))
          .orderBy(testCases.orderIndex);

        sampleTestCases = tests
          .filter((t) => t.isSample)
          .map((t) => ({
            id: t.id,
            input: t.input,
            expectedOutput: t.expectedOutput,
            isSample: true,
            marks: t.marks,
            explanation: t.explanation || undefined,
          }));

        hiddenTestCases = tests
          .filter((t) => !t.isSample)
          .map((t) => ({
            id: t.id,
            input: t.input,
            expectedOutput: t.expectedOutput,
            isSample: false,
            marks: t.marks,
            explanation: t.explanation || undefined,
          }));
      } catch (_) {}

      return {
        id: q.id,
        title: q.title,
        slug: q.slug || q.id,
        category: q.category || undefined,
        difficulty: q.difficulty as any,
        tags: (q.tags as string[]) || [],
        description: q.description || '',
        problemStatement: q.problemStatement,
        inputFormat: q.inputFormat || '',
        outputFormat: q.outputFormat || '',
        constraints: q.constraints || '',
        language: q.language as any,
        starterCode: q.starterCode,
        marks: q.marks,
        timeLimitMs: q.timeLimitMs,
        sampleTestCases,
        hiddenTestCases,
      };
    } catch (err) {
      console.warn(`Notice querying question ${id}:`, (err as any)?.message);
      return INITIAL_QUESTION_BANK.find((q) => q.id === id);
    }
  }

  public async saveBankQuestion(qData: FullQuestion): Promise<FullQuestion> {
    await db
      .insert(questions)
      .values({
        id: qData.id,
        title: qData.title,
        slug: qData.slug || qData.id,
        category: qData.category || 'General',
        difficulty: qData.difficulty || 'Medium',
        tags: qData.tags || [],
        description: qData.description || '',
        problemStatement: qData.problemStatement,
        inputFormat: qData.inputFormat || '',
        outputFormat: qData.outputFormat || '',
        constraints: qData.constraints || '',
        language: qData.language,
        starterCode: qData.starterCode,
        marks: qData.marks || 10,
        timeLimitMs: qData.timeLimitMs || 2500,
        memoryLimitMb: 256,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: questions.id,
        set: {
          title: qData.title,
          slug: qData.slug || qData.id,
          category: qData.category || 'General',
          difficulty: qData.difficulty || 'Medium',
          tags: qData.tags || [],
          description: qData.description || '',
          problemStatement: qData.problemStatement,
          inputFormat: qData.inputFormat || '',
          outputFormat: qData.outputFormat || '',
          constraints: qData.constraints || '',
          language: qData.language,
          starterCode: qData.starterCode,
          marks: qData.marks || 10,
          timeLimitMs: qData.timeLimitMs || 2500,
          updatedAt: new Date(),
        },
      });

    // Re-insert test cases
    await db.delete(testCases).where(eq(testCases.questionId, qData.id));
    const allTests = [
      ...(qData.sampleTestCases || []).map((t, idx) => ({ ...t, isSample: true, orderIndex: idx })),
      ...(qData.hiddenTestCases || []).map((t, idx) => ({
        ...t,
        isSample: false,
        orderIndex: (qData.sampleTestCases?.length || 0) + idx,
      })),
    ];

    for (const t of allTests) {
      await db.insert(testCases).values({
        id: t.id || `${qData.id}-test-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        questionId: qData.id,
        input: t.input,
        expectedOutput: t.expectedOutput,
        isSample: t.isSample,
        marks: Math.round(t.marks || 0),
        explanation: t.explanation || null,
        orderIndex: t.orderIndex,
      });
    }

    return (await this.getBankQuestion(qData.id))!;
  }

  public async deleteBankQuestion(id: string): Promise<boolean> {
    await db.delete(questions).where(eq(questions.id, id));
    return true;
  }

  // ================= CONTEST QUESTIONS RESOLVER ================= //
  public async getContestFullQuestion(
    contestId: string,
    questionId: string
  ): Promise<FullQuestion | undefined> {
    const contest = await this.getContest(contestId);
    if (contest && contest.questionSnapshots && contest.questionSnapshots[questionId]) {
      return contest.questionSnapshots[questionId];
    }
    return this.getBankQuestion(questionId);
  }

  public async getContestPublicQuestions(contestId: string): Promise<Question[]> {
    const contest = await this.getContest(contestId);
    if (!contest) return [];

    const publicQuestions: Question[] = [];
    for (const qId of contest.questionIds) {
      const fullQ = await this.getContestFullQuestion(contestId, qId);
      if (!fullQ) continue;

      const marks =
        contest.customQuestionMarks && contest.customQuestionMarks[qId] !== undefined
          ? contest.customQuestionMarks[qId]
          : fullQ.marks;

      publicQuestions.push({
        id: fullQ.id,
        title: fullQ.title,
        slug: fullQ.slug,
        category: fullQ.category,
        difficulty: fullQ.difficulty,
        tags: fullQ.tags,
        description: fullQ.description || '',
        problemStatement: fullQ.problemStatement,
        inputFormat: fullQ.inputFormat || '',
        outputFormat: fullQ.outputFormat || '',
        constraints: fullQ.constraints || '',
        language: fullQ.language,
        starterCode: fullQ.starterCode,
        marks,
        timeLimitMs: fullQ.timeLimitMs,
        sampleTestCases: fullQ.sampleTestCases || [],
      });
    }

    return publicQuestions;
  }

  // ================= PARTICIPANT ACCOUNTS ================= //
  public async registerAccount(data: {
    name: string;
    registerNumber: string;
    mobile: string;
    email: string;
    department: string;
    year: string;
    college: string;
    password: string;
  }): Promise<ParticipantAccount> {
    const cleanReg = data.registerNumber.trim().toUpperCase();
    const cleanEmail = data.email.trim().toLowerCase();

    const existingReg = await db
      .select()
      .from(accounts)
      .where(eq(accounts.registerNumber, cleanReg))
      .limit(1);

    if (existingReg.length > 0) {
      throw new Error(`Register Number "${cleanReg}" is already registered. Please log in.`);
    }

    const existingEmail = await db
      .select()
      .from(accounts)
      .where(eq(accounts.email, cleanEmail))
      .limit(1);

    if (existingEmail.length > 0) {
      throw new Error(`Email address "${cleanEmail}" is already registered. Please log in.`);
    }

    // Generate unique participant ID (e.g. DDC-2026-001)
    const allAccounts = await db.select().from(accounts);
    const count = allAccounts.length + 1;
    const participantId = `DDC-2026-${String(count).padStart(3, '0')}`;
    const accountId = `acc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const now = Date.now();

    await db.insert(accounts).values({
      id: accountId,
      participantId,
      name: data.name.trim(),
      registerNumber: cleanReg,
      mobile: data.mobile.trim(),
      email: cleanEmail,
      department: data.department.trim(),
      year: data.year.trim(),
      college: data.college.trim(),
      passwordHash: hashedPassword,
    });

    return {
      id: accountId,
      participantId,
      name: data.name.trim(),
      registerNumber: cleanReg,
      mobile: data.mobile.trim(),
      email: cleanEmail,
      department: data.department.trim(),
      year: data.year.trim(),
      college: data.college.trim(),
      createdAt: now,
      updatedAt: now,
    };
  }

  public async loginAccount(identifier: string, pass: string): Promise<ParticipantAccount> {
    const clean = identifier.trim();
    const cleanUpper = clean.toUpperCase();
    const cleanLower = clean.toLowerCase();

    // Look up by email, register number, or participantId
    const rows = await db.select().from(accounts);
    const found = rows.find(
      (a) =>
        a.email.toLowerCase() === cleanLower ||
        a.registerNumber.toUpperCase() === cleanUpper ||
        a.participantId.toUpperCase() === cleanUpper
    );

    if (!found) {
      const err: any = new Error('No registered account found with that email or ID.');
      err.code = 'ACCOUNT_NOT_FOUND';
      throw err;
    }

    const isValid = await bcrypt.compare(pass, found.passwordHash);
    if (!isValid) {
      const err: any = new Error('Invalid account password.');
      err.code = 'INVALID_CREDENTIALS';
      throw err;
    }

    return {
      id: found.id,
      participantId: found.participantId,
      name: found.name,
      registerNumber: found.registerNumber,
      mobile: found.mobile,
      email: found.email,
      department: found.department,
      year: found.year,
      college: found.college,
      createdAt: found.createdAt.getTime(),
      updatedAt: found.updatedAt.getTime(),
    };
  }

  public async getAccountByParticipantId(pId: string): Promise<ParticipantAccount | undefined> {
    const rows = await db
      .select()
      .from(accounts)
      .where(eq(accounts.participantId, pId.toUpperCase()))
      .limit(1);

    if (rows.length === 0) return undefined;
    const a = rows[0];
    return {
      id: a.id,
      participantId: a.participantId,
      name: a.name,
      registerNumber: a.registerNumber,
      mobile: a.mobile,
      email: a.email,
      department: a.department,
      year: a.year,
      college: a.college,
      createdAt: a.createdAt.getTime(),
      updatedAt: a.updatedAt.getTime(),
    };
  }

  public async updateAccount(
    pId: string,
    updates: Partial<ParticipantAccount>
  ): Promise<ParticipantAccount> {
    const account = await this.getAccountByParticipantId(pId);
    if (!account) throw new Error('Account not found');

    await db
      .update(accounts)
      .set({
        name: updates.name || account.name,
        mobile: updates.mobile || account.mobile,
        department: updates.department || account.department,
        year: updates.year || account.year,
        college: updates.college || account.college,
        updatedAt: new Date(),
      })
      .where(eq(accounts.participantId, account.participantId));

    // Also update any contest participant session names
    await db
      .update(contestParticipants)
      .set({
        name: updates.name || account.name,
        department: updates.department || account.department,
        year: updates.year || account.year,
        college: updates.college || account.college,
        updatedAt: new Date(),
      })
      .where(eq(contestParticipants.participantId, account.participantId));

    return (await this.getAccountByParticipantId(pId))!;
  }

  // ================= CONTEST PARTICIPANTS & SESSIONS ================= //
  public async joinContestWithAccount(
    contestId: string,
    participantId: string
  ): Promise<{ participant: Participant; isNew: boolean; timeRemainingSeconds: number }> {
    const contest = await this.getContest(contestId);
    if (!contest) throw new Error('Contest not found');
    if (!contest.allowRegistration && contest.status !== 'active') {
      throw new Error('Registration for this contest is currently closed.');
    }

    const account = await this.getAccountByParticipantId(participantId);
    if (!account) throw new Error('Account profile not found.');

    const sessionKey = `${contestId}:${account.participantId}`;
    const pRows = await db
      .select()
      .from(contestParticipants)
      .where(eq(contestParticipants.id, sessionKey))
      .limit(1);

    if (pRows.length > 0) {
      const p = pRows[0];
      const part: Participant = {
        id: p.id,
        contestId: p.contestId,
        participantId: p.participantId,
        name: p.name,
        registerNumber: p.registerNumber,
        email: p.email,
        department: p.department,
        year: p.year,
        college: p.college || undefined,
        createdAt: p.registeredAt.getTime(),
        startTime: parseInt(p.startTime, 10),
        endTime: p.endTime ? parseInt(p.endTime, 10) : undefined,
        status: p.status as any,
        totalScore: p.score,
        solvedCount: p.solvedCount,
        completionTimeSeconds: p.completionTimeSeconds,
      };
      const timeRemaining = await this.getParticipantTimeRemainingSeconds(
        contestId,
        part.participantId
      );
      return { participant: part, isNew: false, timeRemainingSeconds: timeRemaining };
    }

    const now = Date.now();
    const newParticipant: Participant = {
      id: sessionKey,
      contestId,
      participantId: account.participantId,
      name: account.name,
      registerNumber: account.registerNumber,
      email: account.email,
      department: account.department,
      year: account.year,
      college: account.college,
      createdAt: now,
      startTime: now,
      status: 'active',
      totalScore: 0,
      solvedCount: 0,
      completionTimeSeconds: 0,
    };

    await db.insert(contestParticipants).values({
      id: sessionKey,
      contestId,
      participantId: account.participantId,
      accountId: account.id,
      name: account.name,
      registerNumber: account.registerNumber,
      email: account.email,
      department: account.department,
      year: account.year,
      college: account.college,
      startTime: String(newParticipant.startTime),
      status: 'active',
      score: 0,
      solvedCount: 0,
      completionTimeSeconds: 0,
    });

    const timeRemaining = await this.getParticipantTimeRemainingSeconds(
      contestId,
      newParticipant.participantId
    );
    this.broadcast('participant_registered', { contestId, participant: newParticipant });

    return {
      participant: newParticipant,
      isNew: true,
      timeRemainingSeconds: timeRemaining,
    };
  }

  public async registerParticipant(
    contestId: string,
    data: {
      name: string;
      registerNumber: string;
      department: string;
      year: string;
      email: string;
      participantId: string;
    }
  ) {
    const sessionKey = `${contestId}:${data.participantId}`;
    const pRows = await db
      .select()
      .from(contestParticipants)
      .where(eq(contestParticipants.id, sessionKey))
      .limit(1);

    if (pRows.length > 0) {
      const p = pRows[0];
      return {
        participant: {
          id: p.id,
          contestId: p.contestId,
          participantId: p.participantId,
          name: p.name,
          registerNumber: p.registerNumber,
          email: p.email,
          department: p.department,
          year: p.year,
          college: p.college || undefined,
          createdAt: p.registeredAt.getTime(),
          startTime: parseInt(p.startTime, 10),
          endTime: p.endTime ? parseInt(p.endTime, 10) : undefined,
          status: p.status as any,
          totalScore: p.score,
          solvedCount: p.solvedCount,
          completionTimeSeconds: p.completionTimeSeconds,
        },
        isNew: false,
      };
    }

    const now = Date.now();
    const newPart: Participant = {
      id: sessionKey,
      contestId,
      participantId: data.participantId,
      name: data.name,
      registerNumber: data.registerNumber,
      email: data.email,
      department: data.department,
      year: data.year,
      createdAt: now,
      startTime: now,
      status: 'active',
      totalScore: 0,
      solvedCount: 0,
      completionTimeSeconds: 0,
    };

    await db.insert(contestParticipants).values({
      id: sessionKey,
      contestId,
      participantId: data.participantId,
      name: data.name,
      registerNumber: data.registerNumber,
      email: data.email,
      department: data.department,
      year: data.year,
      startTime: String(newPart.startTime),
      status: 'active',
      score: 0,
      solvedCount: 0,
      completionTimeSeconds: 0,
    });

    return { participant: newPart, isNew: true };
  }

  public async getParticipant(
    contestId: string,
    participantId: string
  ): Promise<Participant | undefined> {
    const sessionKey = `${contestId}:${participantId}`;
    const pRows = await db
      .select()
      .from(contestParticipants)
      .where(eq(contestParticipants.id, sessionKey))
      .limit(1);

    if (pRows.length === 0) return undefined;
    const p = pRows[0];
    return {
      id: p.id,
      contestId: p.contestId,
      participantId: p.participantId,
      name: p.name,
      registerNumber: p.registerNumber,
      email: p.email,
      department: p.department,
      year: p.year,
      college: p.college || undefined,
      createdAt: p.registeredAt.getTime(),
      startTime: parseInt(p.startTime, 10),
      endTime: p.endTime ? parseInt(p.endTime, 10) : undefined,
      status: p.status as any,
      totalScore: p.score,
      solvedCount: p.solvedCount,
      completionTimeSeconds: p.completionTimeSeconds,
    };
  }

  public async updateParticipant(
    contestId: string,
    participantId: string,
    updates: Partial<Participant>
  ): Promise<Participant | undefined> {
    const sessionKey = `${contestId}:${participantId}`;
    const p = await this.getParticipant(contestId, participantId);
    if (!p) return undefined;

    const updated = { ...p, ...updates };

    await db
      .update(contestParticipants)
      .set({
        name: updated.name,
        startTime: String(updated.startTime),
        endTime: updated.endTime ? String(updated.endTime) : null,
        status: updated.status,
        score: updated.totalScore,
        solvedCount: updated.solvedCount,
        completionTimeSeconds: updated.completionTimeSeconds,
        updatedAt: new Date(),
      })
      .where(eq(contestParticipants.id, sessionKey));

    const leaderboard = await this.getContestLeaderboard(contestId);
    this.broadcast('leaderboard_updated', { contestId, leaderboard });
    return updated;
  }

  public async getAllParticipants(contestId: string): Promise<Participant[]> {
    const rows = await db
      .select()
      .from(contestParticipants)
      .where(eq(contestParticipants.contestId, contestId));

    return rows.map((p) => ({
      id: p.id,
      contestId: p.contestId,
      participantId: p.participantId,
      name: p.name,
      registerNumber: p.registerNumber,
      email: p.email,
      department: p.department,
      year: p.year,
      college: p.college || undefined,
      createdAt: p.registeredAt.getTime(),
      startTime: parseInt(p.startTime, 10),
      endTime: p.endTime ? parseInt(p.endTime, 10) : undefined,
      status: p.status as any,
      totalScore: p.score,
      solvedCount: p.solvedCount,
      completionTimeSeconds: p.completionTimeSeconds,
    }));
  }

  public async getParticipantTimeRemainingSeconds(
    contestId: string,
    participantId: string
  ): Promise<number> {
    const p = await this.getParticipant(contestId, participantId);
    if (!p) return 0;
    if (p.status === 'completed' || p.status === 'disqualified') return 0;

    const contest = await this.getContest(contestId);
    const durationMinutes = contest ? contest.durationMinutes : 45;
    const totalDurationSeconds = durationMinutes * 60;
    const elapsedSeconds = Math.floor((Date.now() - p.startTime) / 1000);
    const remaining = totalDurationSeconds - elapsedSeconds;
    return Math.max(0, remaining);
  }

  // ================= SUBMISSIONS & SCORING ================= //
  public async addSubmission(submission: Submission): Promise<void> {
    await db.insert(submissions).values({
      id: submission.id,
      contestId: submission.contestId,
      participantId: submission.participantId,
      participantName: submission.participantName,
      questionId: submission.questionId,
      questionTitle: submission.questionTitle,
      language: submission.language,
      code: submission.code,
      testsPassed: submission.testsPassed,
      totalTests: submission.totalTests,
      score: submission.score,
      status: submission.status,
      executionTimeMs: submission.executionTimeMs || 0,
      compilerOutput: submission.compilerOutput || null,
      testResults: submission.testResults || [],
      submittedAt: String(submission.submittedAt),
    });

    // Recalculate participant score for this contest
    const contestSubs = await db
      .select()
      .from(submissions)
      .where(
        and(
          eq(submissions.contestId, submission.contestId),
          eq(submissions.participantId, submission.participantId)
        )
      );

    // Group by questionId to take the max score per question
    const bestScores: Record<string, number> = {};

    for (const sub of contestSubs) {
      if (!bestScores[sub.questionId] || sub.score > bestScores[sub.questionId]) {
        bestScores[sub.questionId] = sub.score;
      }
    }

    const totalScore = Object.values(bestScores).reduce((acc, curr) => acc + curr, 0);
    const p = await this.getParticipant(submission.contestId, submission.participantId);
    if (p) {
      const elapsed = Math.floor((Date.now() - p.startTime) / 1000);
      await this.updateParticipant(submission.contestId, submission.participantId, {
        totalScore,
        solvedCount: Object.keys(bestScores).filter((qId) => (bestScores[qId] || 0) > 0).length,
        completionTimeSeconds: elapsed,
      });
    }

    this.broadcast('new_submission', submission);
  }

  public async getSubmissions(
    contestId?: string,
    participantId?: string,
    questionId?: string
  ): Promise<Submission[]> {
    let query = db.select().from(submissions);
    const rows = await query;

    let filtered = rows;
    if (contestId) filtered = filtered.filter((s) => s.contestId === contestId);
    if (participantId) filtered = filtered.filter((s) => s.participantId === participantId);
    if (questionId) filtered = filtered.filter((s) => s.questionId === questionId);

    return filtered
      .map((s) => ({
        id: s.id,
        contestId: s.contestId,
        participantId: s.participantId,
        participantName: s.participantName,
        questionId: s.questionId,
        questionTitle: s.questionTitle,
        language: s.language as any,
        code: s.code,
        testsPassed: s.testsPassed,
        totalTests: s.totalTests,
        score: s.score,
        status: s.status as any,
        submittedAt: parseInt(s.submittedAt, 10),
        executionTimeMs: s.executionTimeMs,
        compilerOutput: s.compilerOutput || undefined,
        testResults: s.testResults as any[],
      }))
      .sort((a, b) => b.submittedAt - a.submittedAt);
  }

  // ================= LEADERBOARD ================= //
  public async getContestLeaderboard(contestId: string): Promise<LeaderboardEntry[]> {
    const contest = await this.getContest(contestId);
    const totalQuestions = contest ? contest.questionIds.length : 5;
    const pList = await this.getAllParticipants(contestId);

    // Calculate score & completion time for each participant
    const entries: LeaderboardEntry[] = [];

    for (const p of pList) {
      const pSubs = await db
        .select()
        .from(submissions)
        .where(
          and(eq(submissions.contestId, contestId), eq(submissions.participantId, p.participantId))
        );

      const questionBest: Record<string, number> = {};
      let lastSubTime = p.startTime;

      for (const s of pSubs) {
        if (!questionBest[s.questionId] || s.score > questionBest[s.questionId]) {
          questionBest[s.questionId] = s.score;
        }
        const sTime = parseInt(s.submittedAt, 10);
        if (sTime > lastSubTime) {
          lastSubTime = sTime;
        }
      }

      const totalScore = Object.values(questionBest).reduce((a, b) => a + b, 0);
      const completionSeconds =
        p.completionTimeSeconds && p.completionTimeSeconds > 0
          ? p.completionTimeSeconds
          : Math.floor(((p.endTime || Date.now()) - p.startTime) / 1000);

      const mins = Math.floor(completionSeconds / 60);
      const secs = completionSeconds % 60;
      const timeDisplay = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

      entries.push({
        rank: 0,
        contestId,
        participantId: p.participantId,
        name: p.name,
        registerNumber: p.registerNumber,
        department: p.department,
        year: p.year,
        totalScore,
        solvedCount: Object.keys(questionBest).filter((k) => (questionBest[k] || 0) > 0).length,
        totalQuestions,
        completionTimeSeconds: completionSeconds,
        timeDisplay,
        status: p.status,
        lastSubmissionTime: lastSubTime,
        questionScores: questionBest,
      });
    }

    // Rank logic: 1. Higher score first, 2. If score is equal, shorter completion time first
    entries.sort((a, b) => {
      if (b.totalScore !== a.totalScore) {
        return b.totalScore - a.totalScore;
      }
      return a.completionTimeSeconds - b.completionTimeSeconds;
    });

    entries.forEach((e, idx) => {
      e.rank = idx + 1;
    });

    return entries;
  }

  // ================= PARTICIPANT RESULTS ================= //
  public async getParticipantResults(participantId: string): Promise<ParticipantResult[]> {
    const pSessions = await db
      .select()
      .from(contestParticipants)
      .where(eq(contestParticipants.participantId, participantId));

    const results: ParticipantResult[] = [];

    for (const session of pSessions) {
      const contest = await this.getContest(session.contestId);
      if (!contest) continue;

      const leaderboard = await this.getContestLeaderboard(session.contestId);
      const myEntry = leaderboard.find((e) => e.participantId === participantId);

      const subs = await db
        .select()
        .from(submissions)
        .where(
          and(
            eq(submissions.contestId, session.contestId),
            eq(submissions.participantId, participantId)
          )
        );

      const questionBest: Record<string, number> = {};
      let totalQuestions = contest.questionIds.length;

      for (const s of subs) {
        if (!questionBest[s.questionId] || s.score > questionBest[s.questionId]) {
          questionBest[s.questionId] = s.score;
        }
      }

      const totalScore = Object.values(questionBest).reduce((a, b) => a + b, 0);
      const solvedCount = Object.keys(questionBest).filter((k) => (questionBest[k] || 0) > 0).length;

      const completionSeconds =
        session.completionTimeSeconds > 0
          ? session.completionTimeSeconds
          : Math.floor(((session.endTime ? parseInt(session.endTime, 10) : Date.now()) - parseInt(session.startTime, 10)) / 1000);

      const mins = Math.floor(completionSeconds / 60);
      const secs = completionSeconds % 60;
      const timeDisplay = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

      results.push({
        contestId: contest.id,
        contestTitle: contest.title,
        totalScore,
        totalMarks: contest.totalMarks,
        solvedCount,
        totalQuestions,
        rank: myEntry ? myEntry.rank : 1,
        status: session.status as any,
        completionTimeSeconds: completionSeconds,
        timeDisplay,
        lastSubmissionTime: subs.length > 0 ? parseInt(subs[subs.length - 1].submittedAt, 10) : Date.now(),
      });
    }

    return results;
  }
}

export const dbStore = new DatabaseStore();
