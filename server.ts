import express, { Request, Response } from 'express';
import * as path from 'path';
import { createServer as createViteServer } from 'vite';
import { dbStore } from './server/dbStore';
import { seedDatabase } from './src/db/seed';
import { executeSingle, normalizeOutput } from './server/runner';
import { RunResult, Submission, SubmissionStatus, SupportedLanguage } from './src/types';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Run database sync / seed on startup
  try {
    await seedDatabase();
  } catch (seedErr) {
    console.error('Error during database initialization/seed:', seedErr);
  }

  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Static assets folder for logos & public files
  const publicDir = path.join(process.cwd(), 'public');
  app.use(express.static(publicDir));

  // Health check
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', time: Date.now(), database: 'PostgreSQL' });
  });

  // Server-Sent Events (SSE) for Real-time Leaderboards & Live Submissions Stream
  app.get('/api/events', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    // Initial handshake
    res.write(`event: connected\ndata: ${JSON.stringify({ message: 'Connected to DDC Compiler stream' })}\n\n`);

    const unsubscribe = dbStore.subscribeSSE((chunk) => {
      res.write(chunk);
    });

    req.on('close', () => {
      unsubscribe();
    });
  });

  // ================= PUBLIC CONTEST DISCOVERY ================= //
  app.get('/api/contests', async (req: Request, res: Response) => {
    try {
      const list = await dbStore.getPublicContests();
      res.json(list);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to fetch contests' });
    }
  });

  app.get('/api/contests/:id', async (req: Request, res: Response) => {
    try {
      const contest = await dbStore.getContest(req.params.id);
      if (!contest) {
        return res.status(404).json({ error: 'Contest not found' });
      }
      res.json(contest);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to fetch contest' });
    }
  });

  app.get('/api/contests/:id/questions', async (req: Request, res: Response) => {
    try {
      const qs = await dbStore.getContestPublicQuestions(req.params.id);
      res.json(qs);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to fetch contest questions' });
    }
  });

  app.get('/api/contests/:contestId/questions/:qId', async (req: Request, res: Response) => {
    try {
      const qs = await dbStore.getContestPublicQuestions(req.params.contestId);
      const q = qs.find((item) => item.id === req.params.qId);
      if (!q) {
        return res.status(404).json({ error: 'Question not found in this contest' });
      }
      res.json(q);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to fetch question' });
    }
  });

  // Legacy route for default contest (Breach the Bug)
  app.get('/api/config', async (req: Request, res: Response) => {
    try {
      const contest =
        (await dbStore.getContest('breach-the-bug-round-2')) ||
        (await dbStore.getPublicContests())[0];
      res.json(contest);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/questions', async (req: Request, res: Response) => {
    try {
      const qs = await dbStore.getContestPublicQuestions('breach-the-bug-round-2');
      res.json(qs);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/questions/:id', async (req: Request, res: Response) => {
    try {
      const qs = await dbStore.getContestPublicQuestions('breach-the-bug-round-2');
      const q = qs.find((item) => item.id === req.params.id);
      if (!q) {
        return res.status(404).json({ error: 'Question not found' });
      }
      res.json(q);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ================= PARTICIPANT AUTHENTICATION & PROFILES ================= //
  app.post('/api/auth/register', async (req: Request, res: Response) => {
    try {
      const { name, registerNumber, mobile, email, department, year, college, password } = req.body;
      if (!name || !registerNumber || !mobile || !email || !department || !year || !college || !password) {
        return res.status(400).json({ error: 'All fields are required to create an account.' });
      }

      const account = await dbStore.registerAccount({
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

  app.post('/api/auth/login', async (req: Request, res: Response) => {
    try {
      const { identifier, password } = req.body;
      if (!identifier || !password) {
        return res.status(400).json({ error: 'Email / Participant ID and password are required.' });
      }

      const account = await dbStore.loginAccount(identifier, password);
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

  app.get('/api/me/profile', async (req: Request, res: Response) => {
    try {
      const participantId = (req.headers['x-participant-id'] as string) || (req.query.participantId as string);
      if (!participantId) {
        return res.status(401).json({ error: 'Unauthorized: missing participant identification' });
      }
      const account = await dbStore.getAccountByParticipantId(participantId);
      if (!account) {
        return res.status(404).json({ error: 'Participant profile not found' });
      }
      res.json(account);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/me/profile', async (req: Request, res: Response) => {
    try {
      const participantId =
        (req.headers['x-participant-id'] as string) || req.body.participantId || (req.query.participantId as string);
      if (!participantId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const { name, mobile, department, year, college } = req.body;
      const updated = await dbStore.updateAccount(participantId, {
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

  app.get('/api/me/results', async (req: Request, res: Response) => {
    try {
      const participantId = (req.headers['x-participant-id'] as string) || (req.query.participantId as string);
      if (!participantId) {
        return res.status(400).json({ error: 'Missing participantId' });
      }
      const results = await dbStore.getParticipantResults(participantId);
      res.json(results);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/contests/:contestId/join', async (req: Request, res: Response) => {
    try {
      const { contestId } = req.params;
      const participantId = (req.headers['x-participant-id'] as string) || req.body.participantId;
      if (!participantId) {
        return res.status(400).json({ error: 'Participant ID is required to join' });
      }
      const joinResult = await dbStore.joinContestWithAccount(contestId, participantId);
      res.json(joinResult);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Could not enter contest' });
    }
  });

  // ================= PARTICIPANT REGISTRATION & SESSIONS ================= //
  app.post('/api/contests/:contestId/participants/register', async (req: Request, res: Response) => {
    try {
      const { contestId } = req.params;
      const { name, registerNumber, department, year, email, participantId } = req.body;
      if (!name || !registerNumber || !department || !year || !email || !participantId) {
        return res.status(400).json({ error: 'All fields are required.' });
      }

      const result = await dbStore.registerParticipant(contestId, {
        name,
        registerNumber,
        department,
        year,
        email,
        participantId,
      });

      const timeRemaining = await dbStore.getParticipantTimeRemainingSeconds(contestId, result.participant.participantId);

      res.json({
        participant: result.participant,
        isNew: result.isNew,
        timeRemainingSeconds: timeRemaining,
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Registration failed' });
    }
  });

  app.get('/api/contests/:contestId/participants/:pId', async (req: Request, res: Response) => {
    try {
      const { contestId, pId } = req.params;
      const participant = await dbStore.getParticipant(contestId, pId);
      if (!participant) {
        return res.status(404).json({ error: 'Participant not found in this contest' });
      }
      const timeRemaining = await dbStore.getParticipantTimeRemainingSeconds(contestId, participant.participantId);
      res.json({
        participant,
        timeRemainingSeconds: timeRemaining,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Legacy single-contest participant registration
  app.post('/api/participants/register', async (req: Request, res: Response) => {
    try {
      const { name, registerNumber, department, year, email, participantId } = req.body;
      const result = await dbStore.registerParticipant('breach-the-bug-round-2', {
        name,
        registerNumber,
        department,
        year,
        email,
        participantId,
      });
      const timeRemaining = await dbStore.getParticipantTimeRemainingSeconds(
        'breach-the-bug-round-2',
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

  app.get('/api/participants/:id', async (req: Request, res: Response) => {
    try {
      const participant = await dbStore.getParticipant('breach-the-bug-round-2', req.params.id);
      if (!participant) {
        return res.status(404).json({ error: 'Participant not found' });
      }
      const timeRemaining = await dbStore.getParticipantTimeRemainingSeconds(
        'breach-the-bug-round-2',
        participant.participantId
      );
      res.json({
        participant,
        timeRemainingSeconds: timeRemaining,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
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

      const activeContestId = contestId || 'breach-the-bug-round-2';
      const fullQ =
        (await dbStore.getContestFullQuestion(activeContestId, questionId)) ||
        (await dbStore.getBankQuestion(questionId));

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

      const participant = await dbStore.getParticipant(contestId, participantId);
      if (!participant) {
        return res.status(404).json({ error: 'Participant not found in this contest' });
      }

      // Timer Check
      const timeRemaining = await dbStore.getParticipantTimeRemainingSeconds(contestId, participantId);
      if (timeRemaining <= 0) {
        return res.status(403).json({
          error: 'Contest timer has expired! No further submissions are allowed.',
          timeRemainingSeconds: 0,
        });
      }

      const fullQ = await dbStore.getContestFullQuestion(contestId, questionId);
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

      await dbStore.addSubmission(submission);

      const updatedParticipant = await dbStore.getParticipant(contestId, participantId);

      res.json({
        submission,
        participant: updatedParticipant,
        timeRemainingSeconds: await dbStore.getParticipantTimeRemainingSeconds(contestId, participantId),
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Submission failed' });
    }
  });

  // Legacy submit fallback
  app.post('/api/submit', async (req: Request, res: Response) => {
    req.params.contestId = 'breach-the-bug-round-2';
    const contestId = 'breach-the-bug-round-2';
    const { participantId, questionId, language, code } = req.body;
    const participant = await dbStore.getParticipant(contestId, participantId);
    if (!participant) return res.status(404).json({ error: 'Participant not found' });

    const fullQ = await dbStore.getContestFullQuestion(contestId, questionId);
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

    await dbStore.addSubmission(submission);
    res.json({
      submission,
      participant: await dbStore.getParticipant(contestId, participantId),
      timeRemainingSeconds: await dbStore.getParticipantTimeRemainingSeconds(contestId, participantId),
    });
  });

  // ================= LEADERBOARD & SUBMISSIONS ================= //
  app.get('/api/contests/:contestId/leaderboard', async (req: Request, res: Response) => {
    try {
      const lb = await dbStore.getContestLeaderboard(req.params.contestId);
      res.json(lb);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/contests/:contestId/submissions', async (req: Request, res: Response) => {
    try {
      const { contestId } = req.params;
      const { participantId, questionId } = req.query as {
        participantId?: string;
        questionId?: string;
      };
      const list = await dbStore.getSubmissions(contestId, participantId, questionId);
      res.json(list);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Legacy leaderboard
  app.get('/api/leaderboard', async (req: Request, res: Response) => {
    try {
      const lb = await dbStore.getContestLeaderboard('breach-the-bug-round-2');
      res.json(lb);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/submissions', async (req: Request, res: Response) => {
    try {
      const { participantId, questionId, contestId } = req.query as {
        participantId?: string;
        questionId?: string;
        contestId?: string;
      };
      const list = await dbStore.getSubmissions(contestId, participantId, questionId);
      res.json(list);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ================= ADMIN MANAGEMENT APIS ================= //
  app.post('/api/admin/auth', async (req: Request, res: Response) => {
    try {
      const { password } = req.body;
      const isValid = await dbStore.verifyAdminPassword(password || '');
      if (isValid) {
        return res.json({ success: true, token: 'ddc-admin-token-' + Date.now() });
      }
      res.status(401).json({ error: 'Invalid admin passcode' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Contests Admin
  app.get('/api/admin/contests', async (req: Request, res: Response) => {
    try {
      const list = await dbStore.getAllContests();
      res.json(list);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/admin/contests', async (req: Request, res: Response) => {
    try {
      const contestData = req.body;
      if (!contestData.id || !contestData.title) {
        return res.status(400).json({ error: 'Contest ID and Title are required' });
      }
      const saved = await dbStore.saveContest(contestData);
      res.json({ success: true, contest: saved });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/admin/contests/:id', async (req: Request, res: Response) => {
    try {
      const success = await dbStore.deleteContest(req.params.id);
      res.json({ success });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/admin/contests/:id/duplicate', async (req: Request, res: Response) => {
    try {
      const copy = await dbStore.duplicateContest(req.params.id);
      if (!copy) return res.status(404).json({ error: 'Contest not found' });
      res.json({ success: true, contest: copy });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/admin/contests/:id/publish', async (req: Request, res: Response) => {
    try {
      const published = await dbStore.publishContest(req.params.id);
      if (!published) return res.status(404).json({ error: 'Contest not found' });
      res.json({ success: true, contest: published });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Question Bank Admin
  app.get('/api/admin/question-bank', async (req: Request, res: Response) => {
    try {
      const list = await dbStore.getAllBankQuestions();
      res.json(list);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/admin/question-bank', async (req: Request, res: Response) => {
    try {
      const qData = req.body;
      if (!qData.id || !qData.title || !qData.starterCode) {
        return res.status(400).json({ error: 'Question ID, Title and Starter Code are required' });
      }
      const saved = await dbStore.saveBankQuestion(qData);
      res.json({ success: true, question: saved });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/admin/question-bank/:id', async (req: Request, res: Response) => {
    try {
      const success = await dbStore.deleteBankQuestion(req.params.id);
      res.json({ success });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Legacy Question Admin Map
  app.get('/api/admin/questions', async (req: Request, res: Response) => {
    try {
      const list = await dbStore.getAllBankQuestions();
      res.json(list);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/admin/questions', async (req: Request, res: Response) => {
    try {
      const saved = await dbStore.saveBankQuestion(req.body);
      res.json({ success: true, question: saved });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/admin/questions/:id', async (req: Request, res: Response) => {
    try {
      await dbStore.deleteBankQuestion(req.params.id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Participants & Actions Admin
  app.get('/api/admin/contests/:contestId/participants', async (req: Request, res: Response) => {
    try {
      const list = await dbStore.getAllParticipants(req.params.contestId);
      res.json(list);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/admin/contests/:contestId/participants/:pId/action', async (req: Request, res: Response) => {
    try {
      const { contestId, pId } = req.params;
      const { action, addMinutes } = req.body;
      const p = await dbStore.getParticipant(contestId, pId);
      if (!p) {
        return res.status(404).json({ error: 'Participant not found' });
      }

      if (action === 'reset_timer') {
        await dbStore.updateParticipant(contestId, pId, {
          startTime: Date.now(),
          status: 'active',
          completionTimeSeconds: 0,
        });
      } else if (action === 'add_time') {
        const additionalMs = (addMinutes || 5) * 60 * 1000;
        await dbStore.updateParticipant(contestId, pId, {
          startTime: p.startTime + additionalMs,
          status: 'active',
        });
      } else if (action === 'finish') {
        await dbStore.updateParticipant(contestId, pId, {
          status: 'completed',
          endTime: Date.now(),
        });
      } else if (action === 'disqualify') {
        await dbStore.updateParticipant(contestId, pId, {
          status: 'disqualified',
        });
      }

      res.json({ success: true, participant: await dbStore.getParticipant(contestId, pId) });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Legacy action support
  app.post('/api/admin/participants/:id/action', async (req: Request, res: Response) => {
    try {
      const pId = req.params.id;
      const { action } = req.body;
      const p = await dbStore.getParticipant('breach-the-bug-round-2', pId);
      if (!p) return res.status(404).json({ error: 'Participant not found' });

      if (action === 'reset_timer') {
        await dbStore.updateParticipant('breach-the-bug-round-2', pId, { startTime: Date.now(), status: 'active' });
      } else if (action === 'finish') {
        await dbStore.updateParticipant('breach-the-bug-round-2', pId, { status: 'completed', endTime: Date.now() });
      }
      res.json({ success: true, participant: await dbStore.getParticipant('breach-the-bug-round-2', pId) });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Export Center
  app.get('/api/admin/contests/:contestId/export', async (req: Request, res: Response) => {
    try {
      const { contestId } = req.params;
      const format = req.query.format || 'json';
      const contest = await dbStore.getContest(contestId);
      const leaderboard = await dbStore.getContestLeaderboard(contestId);
      const submissions = await dbStore.getSubmissions(contestId);

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
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Legacy export
  app.get('/api/admin/export', async (req: Request, res: Response) => {
    try {
      const format = req.query.format || 'json';
      const leaderboard = await dbStore.getContestLeaderboard('breach-the-bug-round-2');
      const submissions = await dbStore.getSubmissions('breach-the-bug-round-2');

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
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
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
