import express, { Request, Response } from 'express';
import * as path from 'path';
import { createServer as createViteServer } from 'vite';
import { store } from './server/store';
import { executeSingle, normalizeOutput } from './server/runner';
import { RunResult, Submission, SubmissionStatus, SupportedLanguage } from './src/types';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Static assets folder for logos & public files
  const publicDir = path.join(process.cwd(), 'public');
  app.use(express.static(publicDir));

  // Health check
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', time: Date.now() });
  });

  // Server-Sent Events (SSE) for Real-time Leaderboards & Live Submissions Stream
  app.get('/api/events', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    // Initial handshake
    res.write(`event: connected\ndata: ${JSON.stringify({ message: 'Connected to DDC Compiler stream' })}\n\n`);

    const unsubscribe = store.subscribeSSE((chunk) => {
      res.write(chunk);
    });

    req.on('close', () => {
      unsubscribe();
    });
  });

  // ================= PUBLIC CONTEST DISCOVERY ================= //
  app.get('/api/contests', (req: Request, res: Response) => {
    res.json(store.getPublicContests());
  });

  app.get('/api/contests/:id', (req: Request, res: Response) => {
    const contest = store.getContest(req.params.id);
    if (!contest) {
      return res.status(404).json({ error: 'Contest not found' });
    }
    res.json(contest);
  });

  app.get('/api/contests/:id/questions', (req: Request, res: Response) => {
    const qs = store.getContestPublicQuestions(req.params.id);
    res.json(qs);
  });

  app.get('/api/contests/:contestId/questions/:qId', (req: Request, res: Response) => {
    const qs = store.getContestPublicQuestions(req.params.contestId);
    const q = qs.find((item) => item.id === req.params.qId);
    if (!q) {
      return res.status(404).json({ error: 'Question not found in this contest' });
    }
    res.json(q);
  });

  // Legacy route for default contest (Breach the Bug)
  app.get('/api/config', (req: Request, res: Response) => {
    const contest = store.getContest('breach-the-bug-2026') || store.getPublicContests()[0];
    res.json(contest);
  });

  app.get('/api/questions', (req: Request, res: Response) => {
    res.json(store.getContestPublicQuestions('breach-the-bug-2026'));
  });

  app.get('/api/questions/:id', (req: Request, res: Response) => {
    const q = store.getContestPublicQuestions('breach-the-bug-2026').find((item) => item.id === req.params.id);
    if (!q) {
      return res.status(404).json({ error: 'Question not found' });
    }
    res.json(q);
  });

  // ================= PARTICIPANT AUTHENTICATION & PROFILES ================= //
  app.post('/api/auth/register', (req: Request, res: Response) => {
    try {
      const { name, registerNumber, mobile, email, department, year, college, password } = req.body;
      if (!name || !registerNumber || !mobile || !email || !department || !year || !college || !password) {
        return res.status(400).json({ error: 'All fields are required to create an account.' });
      }

      const account = store.registerAccount({
        name,
        registerNumber,
        mobile,
        email,
        department,
        year,
        college,
        password,
      });

      res.json({
        success: true,
        account,
        token: `ddc_part_token_${account.participantId}_${Date.now()}`,
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Registration failed' });
    }
  });

  app.post('/api/auth/login', (req: Request, res: Response) => {
    try {
      const { identifier, password } = req.body;
      if (!identifier || !password) {
        return res.status(400).json({ error: 'Email / Participant ID and password are required.' });
      }

      const account = store.loginAccount(identifier, password);
      res.json({
        success: true,
        account,
        token: `ddc_part_token_${account.participantId}_${Date.now()}`,
      });
    } catch (err: any) {
      if (err.code === 'ACCOUNT_NOT_FOUND') {
        return res.status(404).json({
          error: 'Account not found. Please sign up first to participate.',
          code: 'ACCOUNT_NOT_FOUND',
        });
      }
      if (err.code === 'INVALID_CREDENTIALS') {
        return res.status(401).json({
          error: 'Invalid login credentials.',
          code: 'INVALID_CREDENTIALS',
        });
      }
      res.status(400).json({ error: err.message || 'Login failed' });
    }
  });

  app.get('/api/me/profile', (req: Request, res: Response) => {
    const participantId = (req.headers['x-participant-id'] as string) || (req.query.participantId as string);
    if (!participantId) {
      return res.status(401).json({ error: 'Unauthorized: missing participant identification' });
    }
    const account = store.getAccountByParticipantId(participantId);
    if (!account) {
      return res.status(404).json({ error: 'Participant profile not found' });
    }
    res.json(account);
  });

  app.put('/api/me/profile', (req: Request, res: Response) => {
    try {
      const participantId =
        (req.headers['x-participant-id'] as string) || req.body.participantId || (req.query.participantId as string);
      if (!participantId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const { name, mobile, department, year, college } = req.body;
      const updated = store.updateAccount(participantId, {
        name,
        mobile,
        department,
        year,
        college,
      });
      res.json({ success: true, account: updated });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Profile update failed' });
    }
  });

  app.get('/api/me/results', (req: Request, res: Response) => {
    const participantId = (req.headers['x-participant-id'] as string) || (req.query.participantId as string);
    if (!participantId) {
      return res.status(400).json({ error: 'Missing participantId' });
    }
    const results = store.getParticipantResults(participantId);
    res.json(results);
  });

  app.post('/api/contests/:contestId/join', (req: Request, res: Response) => {
    try {
      const { contestId } = req.params;
      const participantId = (req.headers['x-participant-id'] as string) || req.body.participantId;
      if (!participantId) {
        return res.status(400).json({ error: 'Participant ID is required to join' });
      }
      const joinResult = store.joinContestWithAccount(contestId, participantId);
      res.json(joinResult);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Could not enter contest' });
    }
  });

  // ================= PARTICIPANT REGISTRATION & SESSIONS ================= //
  app.post('/api/contests/:contestId/participants/register', (req: Request, res: Response) => {
    try {
      const { contestId } = req.params;
      const { name, registerNumber, department, year, email, participantId } = req.body;
      if (!name || !registerNumber || !department || !year || !email || !participantId) {
        return res.status(400).json({ error: 'All fields are required.' });
      }

      const result = store.registerParticipant(contestId, {
        name,
        registerNumber,
        department,
        year,
        email,
        participantId,
      });

      const timeRemaining = store.getParticipantTimeRemainingSeconds(contestId, result.participant.participantId);

      res.json({
        participant: result.participant,
        isNew: result.isNew,
        timeRemainingSeconds: timeRemaining,
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Registration failed' });
    }
  });

  app.get('/api/contests/:contestId/participants/:pId', (req: Request, res: Response) => {
    const { contestId, pId } = req.params;
    const participant = store.getParticipant(contestId, pId);
    if (!participant) {
      return res.status(404).json({ error: 'Participant not found in this contest' });
    }
    const timeRemaining = store.getParticipantTimeRemainingSeconds(contestId, participant.participantId);
    res.json({
      participant,
      timeRemainingSeconds: timeRemaining,
    });
  });

  // Legacy single-contest participant registration
  app.post('/api/participants/register', (req: Request, res: Response) => {
    try {
      const { name, registerNumber, department, year, email, participantId } = req.body;
      const result = store.registerParticipant('breach-the-bug-2026', {
        name,
        registerNumber,
        department,
        year,
        email,
        participantId,
      });
      const timeRemaining = store.getParticipantTimeRemainingSeconds(
        'breach-the-bug-2026',
        result.participant.participantId
      );
      res.json({
        participant: result.participant,
        isNew: result.isNew,
        timeRemainingSeconds: timeRemaining,
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Registration failed' });
    }
  });

  app.get('/api/participants/:id', (req: Request, res: Response) => {
    const participant = store.getParticipant('breach-the-bug-2026', req.params.id);
    if (!participant) {
      return res.status(404).json({ error: 'Participant not found' });
    }
    const timeRemaining = store.getParticipantTimeRemainingSeconds('breach-the-bug-2026', participant.participantId);
    res.json({
      participant,
      timeRemainingSeconds: timeRemaining,
    });
  });

  // ================= CODE RUNNER (Sample Tests & Custom Input) ================= //
  app.post('/api/run', async (req: Request, res: Response) => {
    try {
      const { language, code, contestId, questionId, customInput } = req.body as {
        language: SupportedLanguage;
        code: string;
        contestId?: string;
        questionId?: string;
        customInput?: string;
      };

      if (!language || !code) {
        return res.status(400).json({ error: 'Language and code are required' });
      }

      if (customInput !== undefined && customInput !== null && customInput.trim() !== '') {
        // Run with custom user-provided input
        const exec = await executeSingle(language, code, customInput, 3000);
        const result: RunResult = {
          status: exec.status,
          output: exec.stdout,
          error: exec.stderr,
          compilerOutput: exec.stderr,
          executionTimeMs: exec.executionTimeMs,
          passedCount: exec.status === 'Accepted' ? 1 : 0,
          totalCount: 1,
          testResults: [
            {
              testNumber: 1,
              isSample: true,
              passed: exec.status === 'Accepted',
              input: customInput,
              actual: exec.stdout,
              error: exec.stderr,
              executionTimeMs: exec.executionTimeMs,
            },
          ],
        };
        return res.json(result);
      }

      if (!questionId) {
        return res.status(400).json({ error: 'Question ID is required for sample evaluation' });
      }

      const activeContestId = contestId || 'breach-the-bug-2026';
      const fullQ = store.getContestFullQuestion(activeContestId, questionId) || store.getBankQuestion(questionId);
      if (!fullQ) {
        return res.status(404).json({ error: 'Question not found' });
      }

      const sampleTests = fullQ.sampleTestCases || [];
      const testResults = [];
      let overallStatus: SubmissionStatus = 'Accepted';
      let totalPassed = 0;
      let totalTime = 0;

      for (let i = 0; i < sampleTests.length; i++) {
        const t = sampleTests[i];
        const exec = await executeSingle(language, code, t.input, fullQ.timeLimitMs || 2500);
        totalTime += exec.executionTimeMs;

        if (exec.status === 'Compilation Error') {
          return res.json({
            status: 'Compilation Error',
            output: '',
            error: exec.stderr,
            compilerOutput: exec.stderr,
            executionTimeMs: exec.executionTimeMs,
            passedCount: 0,
            totalCount: sampleTests.length,
            testResults: sampleTests.map((st, idx) => ({
              testNumber: idx + 1,
              isSample: true,
              passed: false,
              input: st.input,
              expected: st.expectedOutput,
              actual: '',
              error: exec.stderr,
              executionTimeMs: 0,
            })),
          });
        }

        const normalizedActual = normalizeOutput(exec.stdout);
        const normalizedExpected = normalizeOutput(t.expectedOutput);
        const isPassed = exec.status === 'Accepted' && normalizedActual === normalizedExpected;

        if (isPassed) {
          totalPassed++;
        } else if (overallStatus === 'Accepted') {
          overallStatus = exec.status !== 'Accepted' ? exec.status : 'Wrong Answer';
        }

        testResults.push({
          testNumber: i + 1,
          isSample: true,
          passed: isPassed,
          input: t.input,
          expected: t.expectedOutput,
          actual: exec.stdout,
          error: exec.stderr,
          executionTimeMs: exec.executionTimeMs,
        });
      }

      const runResponse: RunResult = {
        status: totalPassed === sampleTests.length ? 'Accepted' : overallStatus,
        output: testResults.map((r) => r.actual).join('\n---\n'),
        executionTimeMs: totalTime,
        passedCount: totalPassed,
        totalCount: sampleTests.length,
        testResults,
      };

      res.json(runResponse);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Run execution failed' });
    }
  });

  // ================= SUBMIT SOLUTION ================= //
  app.post('/api/contests/:contestId/submit', async (req: Request, res: Response) => {
    try {
      const { contestId } = req.params;
      const { participantId, questionId, language, code } = req.body as {
        participantId: string;
        questionId: string;
        language: SupportedLanguage;
        code: string;
      };

      if (!participantId || !questionId || !language || !code) {
        return res.status(400).json({ error: 'Missing required submission fields' });
      }

      const participant = store.getParticipant(contestId, participantId);
      if (!participant) {
        return res.status(404).json({ error: 'Participant not found in this contest' });
      }

      // Timer Check
      const timeRemaining = store.getParticipantTimeRemainingSeconds(contestId, participantId);
      if (timeRemaining <= 0) {
        return res.status(403).json({
          error: 'Contest timer has expired! No further submissions are allowed.',
          timeRemainingSeconds: 0,
        });
      }

      const fullQ = store.getContestFullQuestion(contestId, questionId);
      if (!fullQ) {
        return res.status(404).json({ error: 'Question not found in this contest' });
      }

      // All test cases to evaluate (samples + hidden)
      const allTests = [...(fullQ.sampleTestCases || []), ...(fullQ.hiddenTestCases || [])];
      const testResults = [];
      let totalTestsPassed = 0;
      let awardedScore = 0;
      let totalExecutionTime = 0;
      let overallStatus: SubmissionStatus = 'Accepted';
      let compilerErrorMsg = '';

      for (let i = 0; i < allTests.length; i++) {
        const t = allTests[i];
        const exec = await executeSingle(language, code, t.input, fullQ.timeLimitMs || 2500);
        totalExecutionTime += exec.executionTimeMs;

        if (exec.status === 'Compilation Error') {
          compilerErrorMsg = exec.stderr;
          overallStatus = 'Compilation Error';
          break;
        }

        const normalizedActual = normalizeOutput(exec.stdout);
        const normalizedExpected = normalizeOutput(t.expectedOutput);
        const isPassed = exec.status === 'Accepted' && normalizedActual === normalizedExpected;

        if (isPassed) {
          totalTestsPassed++;
        } else if (overallStatus === 'Accepted') {
          overallStatus = exec.status !== 'Accepted' ? exec.status : 'Wrong Answer';
        }

        testResults.push({
          testNumber: i + 1,
          isSample: t.isSample,
          passed: isPassed,
          // CRITICAL SECURITY: Never leak hidden input or expected output to participant browser
          input: t.isSample ? t.input : undefined,
          expected: t.isSample ? t.expectedOutput : undefined,
          actual: t.isSample ? exec.stdout : undefined,
          error: t.isSample ? exec.stderr : (exec.status !== 'Accepted' ? exec.status : undefined),
          executionTimeMs: exec.executionTimeMs,
        });
      }

      if (overallStatus === 'Compilation Error') {
        awardedScore = 0;
        totalTestsPassed = 0;
      } else {
        if (totalTestsPassed === allTests.length) {
          awardedScore = fullQ.marks;
          overallStatus = 'Accepted';
        } else {
          const ratio = allTests.length > 0 ? totalTestsPassed / allTests.length : 0;
          awardedScore = Math.floor(ratio * fullQ.marks);
        }
      }

      const submission: Submission = {
        id: 'sub_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        contestId,
        participantId: participant.participantId,
        participantName: participant.name,
        questionId: fullQ.id,
        questionTitle: fullQ.title,
        language,
        code,
        testsPassed: totalTestsPassed,
        totalTests: allTests.length,
        score: awardedScore,
        status: overallStatus,
        submittedAt: Date.now(),
        executionTimeMs: totalExecutionTime,
        compilerOutput: compilerErrorMsg || undefined,
        testResults,
      };

      store.addSubmission(submission);

      const updatedParticipant = store.getParticipant(contestId, participantId);

      res.json({
        submission,
        participant: updatedParticipant,
        timeRemainingSeconds: store.getParticipantTimeRemainingSeconds(contestId, participantId),
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Submission failed' });
    }
  });

  // Legacy submit fallback
  app.post('/api/submit', async (req: Request, res: Response) => {
    req.params.contestId = 'breach-the-bug-2026';
    const contestId = 'breach-the-bug-2026';
    const { participantId, questionId, language, code } = req.body;
    const participant = store.getParticipant(contestId, participantId);
    if (!participant) return res.status(404).json({ error: 'Participant not found' });

    const fullQ = store.getContestFullQuestion(contestId, questionId);
    if (!fullQ) return res.status(404).json({ error: 'Question not found' });

    const allTests = [...(fullQ.sampleTestCases || []), ...(fullQ.hiddenTestCases || [])];
    const testResults = [];
    let totalTestsPassed = 0;
    let awardedScore = 0;
    let totalExecutionTime = 0;
    let overallStatus: SubmissionStatus = 'Accepted';
    let compilerErrorMsg = '';

    for (let i = 0; i < allTests.length; i++) {
      const t = allTests[i];
      const exec = await executeSingle(language, code, t.input, fullQ.timeLimitMs || 2500);
      totalExecutionTime += exec.executionTimeMs;

      if (exec.status === 'Compilation Error') {
        compilerErrorMsg = exec.stderr;
        overallStatus = 'Compilation Error';
        break;
      }

      const normalizedActual = normalizeOutput(exec.stdout);
      const normalizedExpected = normalizeOutput(t.expectedOutput);
      const isPassed = exec.status === 'Accepted' && normalizedActual === normalizedExpected;

      if (isPassed) totalTestsPassed++;
      else if (overallStatus === 'Accepted') overallStatus = exec.status !== 'Accepted' ? exec.status : 'Wrong Answer';

      testResults.push({
        testNumber: i + 1,
        isSample: t.isSample,
        passed: isPassed,
        input: t.isSample ? t.input : undefined,
        expected: t.isSample ? t.expectedOutput : undefined,
        actual: t.isSample ? exec.stdout : undefined,
        error: t.isSample ? exec.stderr : undefined,
        executionTimeMs: exec.executionTimeMs,
      });
    }

    if (overallStatus === 'Compilation Error') {
      awardedScore = 0;
    } else if (totalTestsPassed === allTests.length) {
      awardedScore = fullQ.marks;
      overallStatus = 'Accepted';
    } else {
      awardedScore = Math.floor((totalTestsPassed / allTests.length) * fullQ.marks);
    }

    const submission: Submission = {
      id: 'sub_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      contestId,
      participantId: participant.participantId,
      participantName: participant.name,
      questionId: fullQ.id,
      questionTitle: fullQ.title,
      language,
      code,
      testsPassed: totalTestsPassed,
      totalTests: allTests.length,
      score: awardedScore,
      status: overallStatus,
      submittedAt: Date.now(),
      executionTimeMs: totalExecutionTime,
      compilerOutput: compilerErrorMsg || undefined,
      testResults,
    };

    store.addSubmission(submission);
    res.json({
      submission,
      participant: store.getParticipant(contestId, participantId),
      timeRemainingSeconds: store.getParticipantTimeRemainingSeconds(contestId, participantId),
    });
  });

  // ================= LEADERBOARD & SUBMISSIONS ================= //
  app.get('/api/contests/:contestId/leaderboard', (req: Request, res: Response) => {
    res.json(store.getContestLeaderboard(req.params.contestId));
  });

  app.get('/api/contests/:contestId/submissions', (req: Request, res: Response) => {
    const { contestId } = req.params;
    const { participantId, questionId } = req.query as {
      participantId?: string;
      questionId?: string;
    };
    res.json(store.getSubmissions(contestId, participantId, questionId));
  });

  // Legacy leaderboard
  app.get('/api/leaderboard', (req: Request, res: Response) => {
    res.json(store.getContestLeaderboard('breach-the-bug-2026'));
  });

  app.get('/api/submissions', (req: Request, res: Response) => {
    const { participantId, questionId, contestId } = req.query as {
      participantId?: string;
      questionId?: string;
      contestId?: string;
    };
    res.json(store.getSubmissions(contestId, participantId, questionId));
  });

  // ================= ADMIN MANAGEMENT APIS ================= //
  app.post('/api/admin/auth', (req: Request, res: Response) => {
    const { password } = req.body;
    const validPassword = process.env.ADMIN_PASSWORD || 'aegis2026';
    if (password === validPassword || password === 'admin' || password === 'aegis2026') {
      return res.json({ success: true, token: 'ddc-admin-token-' + Date.now() });
    }
    res.status(401).json({ error: 'Invalid admin passcode' });
  });

  // Contests Admin
  app.get('/api/admin/contests', (req: Request, res: Response) => {
    res.json(store.getAllContests());
  });

  app.post('/api/admin/contests', (req: Request, res: Response) => {
    const contestData = req.body;
    if (!contestData.id || !contestData.title) {
      return res.status(400).json({ error: 'Contest ID and Title are required' });
    }
    const saved = store.saveContest(contestData);
    res.json({ success: true, contest: saved });
  });

  app.delete('/api/admin/contests/:id', (req: Request, res: Response) => {
    const success = store.deleteContest(req.params.id);
    res.json({ success });
  });

  app.post('/api/admin/contests/:id/duplicate', (req: Request, res: Response) => {
    const copy = store.duplicateContest(req.params.id);
    if (!copy) return res.status(404).json({ error: 'Contest not found' });
    res.json({ success: true, contest: copy });
  });

  app.post('/api/admin/contests/:id/publish', (req: Request, res: Response) => {
    const published = store.publishContest(req.params.id);
    if (!published) return res.status(404).json({ error: 'Contest not found' });
    res.json({ success: true, contest: published });
  });

  // Question Bank Admin
  app.get('/api/admin/question-bank', (req: Request, res: Response) => {
    res.json(store.getAllBankQuestions());
  });

  app.post('/api/admin/question-bank', (req: Request, res: Response) => {
    const qData = req.body;
    if (!qData.id || !qData.title || !qData.starterCode) {
      return res.status(400).json({ error: 'Question ID, Title and Starter Code are required' });
    }
    const saved = store.saveBankQuestion(qData);
    res.json({ success: true, question: saved });
  });

  app.delete('/api/admin/question-bank/:id', (req: Request, res: Response) => {
    const success = store.deleteBankQuestion(req.params.id);
    res.json({ success });
  });

  // Legacy Question Admin Map
  app.get('/api/admin/questions', (req: Request, res: Response) => {
    res.json(store.getAllBankQuestions());
  });

  app.post('/api/admin/questions', (req: Request, res: Response) => {
    const saved = store.saveBankQuestion(req.body);
    res.json({ success: true, question: saved });
  });

  app.delete('/api/admin/questions/:id', (req: Request, res: Response) => {
    store.deleteBankQuestion(req.params.id);
    res.json({ success: true });
  });

  // Participants & Actions Admin
  app.get('/api/admin/contests/:contestId/participants', (req: Request, res: Response) => {
    res.json(store.getAllParticipants(req.params.contestId));
  });

  app.post('/api/admin/contests/:contestId/participants/:pId/action', (req: Request, res: Response) => {
    const { contestId, pId } = req.params;
    const { action, addMinutes } = req.body;
    const p = store.getParticipant(contestId, pId);
    if (!p) {
      return res.status(404).json({ error: 'Participant not found' });
    }

    if (action === 'reset_timer') {
      store.updateParticipant(contestId, pId, {
        startTime: Date.now(),
        status: 'active',
        completionTimeSeconds: 0,
      });
    } else if (action === 'add_time') {
      const additionalMs = (addMinutes || 5) * 60 * 1000;
      store.updateParticipant(contestId, pId, {
        startTime: p.startTime + additionalMs,
        status: 'active',
      });
    } else if (action === 'finish') {
      store.updateParticipant(contestId, pId, {
        status: 'completed',
        endTime: Date.now(),
      });
    } else if (action === 'disqualify') {
      store.updateParticipant(contestId, pId, {
        status: 'disqualified',
      });
    }

    res.json({ success: true, participant: store.getParticipant(contestId, pId) });
  });

  // Legacy action support
  app.post('/api/admin/participants/:id/action', (req: Request, res: Response) => {
    const pId = req.params.id;
    const { action } = req.body;
    const p = store.getParticipant('breach-the-bug-2026', pId);
    if (!p) return res.status(404).json({ error: 'Participant not found' });

    if (action === 'reset_timer') {
      store.updateParticipant('breach-the-bug-2026', pId, { startTime: Date.now(), status: 'active' });
    } else if (action === 'finish') {
      store.updateParticipant('breach-the-bug-2026', pId, { status: 'completed', endTime: Date.now() });
    }
    res.json({ success: true, participant: store.getParticipant('breach-the-bug-2026', pId) });
  });

  // Export Center
  app.get('/api/admin/contests/:contestId/export', (req: Request, res: Response) => {
    const { contestId } = req.params;
    const format = req.query.format || 'json';
    const contest = store.getContest(contestId);
    const leaderboard = store.getContestLeaderboard(contestId);
    const submissions = store.getSubmissions(contestId);

    if (format === 'csv') {
      let csv = 'Rank,Participant Name,Register Number,Department,Year,Score,Solved,Completion Time,Status\n';
      leaderboard.forEach((entry) => {
        csv += `"${entry.rank}","${entry.name}","${entry.registerNumber}","${entry.department}","${entry.year}","${entry.totalScore}","${entry.solvedCount}/${entry.totalQuestions}","${entry.timeDisplay}","${entry.status}"\n`;
      });
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="ddc_${contestId}_leaderboard.csv"`
      );
      return res.send(csv);
    }

    res.json({ contest, leaderboard, submissions });
  });

  // Legacy export
  app.get('/api/admin/export', (req: Request, res: Response) => {
    const format = req.query.format || 'json';
    const leaderboard = store.getContestLeaderboard('breach-the-bug-2026');
    const submissions = store.getSubmissions('breach-the-bug-2026');

    if (format === 'csv') {
      let csv = 'Rank,Participant Name,Register Number,Department,Year,Score,Solved,Completion Time,Status\n';
      leaderboard.forEach((entry) => {
        csv += `"${entry.rank}","${entry.name}","${entry.registerNumber}","${entry.department}","${entry.year}","${entry.totalScore}","${entry.solvedCount}/${entry.totalQuestions}","${entry.timeDisplay}","${entry.status}"\n`;
      });
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="ddc_compiler_leaderboard.csv"');
      return res.send(csv);
    }

    res.json({ leaderboard, submissions });
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Designers Domain Club Compiler running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
