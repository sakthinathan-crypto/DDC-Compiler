import express, { Request, Response } from 'express';
import * as path from 'path';
import { dbStore } from './dbStore';
import { seedDatabase } from '../src/db/seed';
import { executeSingle, normalizeOutput, compareOutputs } from './runner';
import { RunResult, Submission, SubmissionStatus, SupportedLanguage } from '../src/types';

let dbSeeded = false;

export async function createApp() {
  const app = express();

  // Run database sync / seed once on startup
  if (!dbSeeded) {
    try {
      await seedDatabase();
      dbSeeded = true;
    } catch (seedErr) {
      console.error('Database initialization/seed notice:', seedErr);
    }
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
    res.write(
      `event: connected\ndata: ${JSON.stringify({ message: 'Connected to DDC Compiler stream' })}\n\n`
    );

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
        return res.status(400).json({ error: 'Please provide email/ID and password.' });
      }

      const account = await dbStore.loginAccount(identifier, password);
      res.json({
        success: true,
        account,
        token: `ddc_part_token_${account.participantId}_${Date.now()}`,
      });
    } catch (err: any) {
      res.status(401).json({ error: err.message || 'Invalid credentials' });
    }
  });

  // Profile endpoints (support /api/me/profile and /api/account/:participantId)
  app.get(['/api/me/profile', '/api/account/:participantId'], async (req: Request, res: Response) => {
    try {
      const pId = (req.query.participantId as string) || (req.headers['x-participant-id'] as string) || req.params.participantId;
      if (!pId) {
        return res.status(400).json({ error: 'Participant ID is required' });
      }
      const account = await dbStore.getAccountByParticipantId(pId);
      if (!account) {
        return res.status(404).json({ error: 'Account not found' });
      }
      res.json(account);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put(['/api/me/profile', '/api/account/:participantId'], async (req: Request, res: Response) => {
    try {
      const pId = req.body.participantId || (req.headers['x-participant-id'] as string) || req.params.participantId;
      if (!pId) {
        return res.status(400).json({ error: 'Participant ID is required' });
      }
      const updated = await dbStore.updateAccount(pId, req.body);
      res.json({ success: true, account: updated });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.get('/api/me/results', async (req: Request, res: Response) => {
    try {
      const pId = (req.query.participantId as string) || (req.headers['x-participant-id'] as string);
      if (!pId) {
        return res.status(400).json({ error: 'Participant ID is required' });
      }
      const results = await dbStore.getParticipantResults(pId);
      res.json(results);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Join contest using account
  app.post('/api/contests/:contestId/join', async (req: Request, res: Response) => {
    try {
      const { participantId } = req.body;
      if (!participantId) {
        return res.status(400).json({ error: 'Participant ID is required.' });
      }

      const joinResult = await dbStore.joinContestWithAccount(req.params.contestId, participantId);
      res.json({
        success: true,
        participant: joinResult.participant,
        isNew: joinResult.isNew,
        timeRemainingSeconds: joinResult.timeRemainingSeconds,
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to join contest' });
    }
  });

  // Participant Registration (contest-specific & generic)
  app.post(['/api/contests/:contestId/participants/register', '/api/register'], async (req: Request, res: Response) => {
    try {
      const { contestId, name, registerNumber, department, year, email, participantId } = req.body;
      const cId = req.params.contestId || contestId || 'breach-the-bug-round-2';

      if (!name || !registerNumber || !department || !year || !email || !participantId) {
        return res.status(400).json({ error: 'All fields are required.' });
      }

      const result = await dbStore.registerParticipant(cId, {
        name,
        registerNumber,
        department,
        year,
        email,
        participantId,
      });

      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.get(['/api/contests/:contestId/participants/:id', '/api/participant/:participantId'], async (req: Request, res: Response) => {
    try {
      const contestId = req.params.contestId || (req.query.contestId as string) || 'breach-the-bug-round-2';
      const participantId = req.params.id || req.params.participantId;
      const participant = await dbStore.getParticipant(contestId, participantId);
      if (!participant) {
        return res.status(404).json({ error: 'Participant not found' });
      }
      const timeRemaining = await dbStore.getParticipantTimeRemainingSeconds(
        contestId,
        participantId
      );
      res.json({ participant, timeRemainingSeconds: timeRemaining });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Finish or Disqualify Contest Session
  app.post(['/api/contests/:contestId/finish', '/api/participant/finish'], async (req: Request, res: Response) => {
    try {
      const { contestId, participantId, reason } = req.body;
      const cId = req.params.contestId || contestId || 'breach-the-bug-round-2';
      const pId = participantId;

      if (!pId) {
        return res.status(400).json({ error: 'participantId is required' });
      }
      const current = await dbStore.getParticipant(cId, pId);
      if (!current) {
        return res.status(404).json({ error: 'Participant not found' });
      }

      const now = Date.now();
      const elapsed = Math.floor((now - current.startTime) / 1000);
      const isDisqualified = reason === 'tab_switch_exceeded' || reason === 'disqualified';

      const updated = await dbStore.updateParticipant(cId, pId, {
        status: isDisqualified ? 'disqualified' : 'completed',
        endTime: now,
        completionTimeSeconds: elapsed,
      });

      res.json({ success: true, participant: updated });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ================= CODE EXECUTION & SUBMISSIONS ================= //
  app.post('/api/run', async (req: Request, res: Response) => {
    try {
      const { contestId, questionId, code, language, customInput } = req.body;
      if (!code || !language) {
        return res.status(400).json({ error: 'Code and language are required' });
      }

      const cId = contestId || 'breach-the-bug-round-2';
      const q = questionId ? await dbStore.getContestFullQuestion(cId, questionId) : undefined;
      const timeLimit = q?.timeLimitMs || 2500;

      // Mode A: Run with custom input
      if (customInput !== undefined) {
        const rawResult = await executeSingle(
          language as SupportedLanguage,
          code,
          String(customInput),
          timeLimit
        );

        const isSuccess = rawResult.status === 'Accepted';
        const displayOutput = rawResult.stdout || (rawResult.stderr ? rawResult.stderr : '');

        const result: RunResult = {
          status: rawResult.status,
          output: displayOutput,
          error: rawResult.stderr || undefined,
          compilerOutput: rawResult.status === 'Compilation Error' ? rawResult.stderr : undefined,
          executionTimeMs: rawResult.executionTimeMs,
          testResults: [
            {
              testNumber: 1,
              isSample: true,
              passed: isSuccess,
              input: String(customInput),
              expected: '',
              actual: displayOutput,
              error: rawResult.stderr || undefined,
              executionTimeMs: rawResult.executionTimeMs,
            },
          ],
          passedCount: isSuccess ? 1 : 0,
          totalCount: 1,
        };

        return res.json(result);
      }

      // Mode B: Run all sample test cases
      const sampleTests = q?.sampleTestCases && q.sampleTestCases.length > 0
        ? q.sampleTestCases
        : [{ id: 'default-sample', input: '', expectedOutput: '', isSample: true, marks: 0 }];

      const testResults: any[] = [];
      let passedCount = 0;
      let overallStatus: SubmissionStatus = 'Accepted';
      let compilerOutput: string | undefined = undefined;
      let firstOutput = '';

      for (let i = 0; i < sampleTests.length; i++) {
        const tc = sampleTests[i];
        const rawResult = await executeSingle(
          language as SupportedLanguage,
          code,
          tc.input,
          timeLimit
        );

        if (i === 0) {
          firstOutput = rawResult.stdout;
        }

        if (rawResult.status === 'Compilation Error') {
          overallStatus = 'Compilation Error';
          compilerOutput = rawResult.stderr;
          testResults.push({
            testNumber: i + 1,
            isSample: true,
            passed: false,
            input: tc.input,
            expected: tc.expectedOutput,
            actual: '',
            error: rawResult.stderr,
            executionTimeMs: rawResult.executionTimeMs,
          });
          break; // Stop further evaluation on compiler error
        }

        if (rawResult.status === 'Time Limit Exceeded') {
          if (overallStatus === 'Accepted') overallStatus = 'Time Limit Exceeded';
          testResults.push({
            testNumber: i + 1,
            isSample: true,
            passed: false,
            input: tc.input,
            expected: tc.expectedOutput,
            actual: rawResult.stdout || '',
            error: 'Time Limit Exceeded',
            executionTimeMs: rawResult.executionTimeMs,
          });
          continue;
        }

        if (rawResult.status === 'Runtime Error') {
          if (overallStatus === 'Accepted') overallStatus = 'Runtime Error';
          testResults.push({
            testNumber: i + 1,
            isSample: true,
            passed: false,
            input: tc.input,
            expected: tc.expectedOutput,
            actual: rawResult.stdout || '',
            error: rawResult.stderr || 'Runtime Error',
            executionTimeMs: rawResult.executionTimeMs,
          });
          continue;
        }

        const isMatch = tc.expectedOutput
          ? compareOutputs(rawResult.stdout, tc.expectedOutput)
          : rawResult.status === 'Accepted';

        if (isMatch) {
          passedCount++;
          testResults.push({
            testNumber: i + 1,
            isSample: true,
            passed: true,
            input: tc.input,
            expected: tc.expectedOutput,
            actual: normalizeOutput(rawResult.stdout),
            executionTimeMs: rawResult.executionTimeMs,
          });
        } else {
          if (overallStatus === 'Accepted') overallStatus = 'Wrong Answer';
          testResults.push({
            testNumber: i + 1,
            isSample: true,
            passed: false,
            input: tc.input,
            expected: tc.expectedOutput,
            actual: normalizeOutput(rawResult.stdout),
            error: rawResult.stderr || undefined,
            executionTimeMs: rawResult.executionTimeMs,
          });
        }
      }

      const result: RunResult = {
        status: overallStatus,
        output: firstOutput || (testResults[0]?.actual ?? ''),
        error: compilerOutput || (overallStatus !== 'Accepted' ? testResults.find((t) => t.error)?.error : undefined),
        compilerOutput,
        executionTimeMs: Math.max(...testResults.map((t) => t.executionTimeMs || 0), 0),
        testResults,
        passedCount,
        totalCount: sampleTests.length,
      };

      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Execution failed' });
    }
  });

  // Code submission (support /api/contests/:contestId/submit and /api/submit)
  app.post(['/api/contests/:contestId/submit', '/api/submit'], async (req: Request, res: Response) => {
    try {
      const { contestId, questionId, participantId, participantName, code, language } = req.body;
      const cId = req.params.contestId || contestId || 'breach-the-bug-round-2';

      if (!questionId || !participantId || !code || !language) {
        return res.status(400).json({ error: 'Missing required submission fields.' });
      }

      const p = await dbStore.getParticipant(cId, participantId);
      if (!p) {
        return res.status(403).json({ error: 'Participant session not found or expired.' });
      }

      const timeRem = await dbStore.getParticipantTimeRemainingSeconds(cId, participantId);
      if (timeRem <= 0 && p.status === 'completed') {
        return res.status(400).json({ error: 'Contest duration has ended.' });
      }

      const fullQ = await dbStore.getContestFullQuestion(cId, questionId);
      if (!fullQ) {
        return res.status(404).json({ error: 'Question not found' });
      }

      const allTestCases = [
        ...(fullQ.sampleTestCases || []),
        ...(fullQ.hiddenTestCases || []),
      ];

      const testResults: any[] = [];
      let testsPassed = 0;
      let totalTime = 0;
      let overallStatus: SubmissionStatus = 'Accepted';
      let compilerOutput = '';

      for (let i = 0; i < allTestCases.length; i++) {
        const tc = allTestCases[i];
        const execRes = await executeSingle(
          language as SupportedLanguage,
          code,
          tc.input,
          fullQ.timeLimitMs || 2500
        );

        totalTime = Math.max(totalTime, execRes.executionTimeMs);

        if (execRes.status === 'Compilation Error') {
          compilerOutput = execRes.stderr;
          overallStatus = 'Compilation Error';
          testResults.push({
            testNumber: i + 1,
            isSample: tc.isSample,
            passed: false,
            actual: '',
            expected: tc.isSample ? tc.expectedOutput : '[HIDDEN]',
            executionTimeMs: execRes.executionTimeMs,
            error: execRes.stderr,
          });
          break;
        }

        if (execRes.status === 'Time Limit Exceeded') {
          if (overallStatus === 'Accepted') overallStatus = 'Time Limit Exceeded';
          testResults.push({
            testNumber: i + 1,
            isSample: tc.isSample,
            passed: false,
            actual: '',
            expected: tc.isSample ? tc.expectedOutput : '[HIDDEN]',
            executionTimeMs: execRes.executionTimeMs,
            error: 'Time Limit Exceeded',
          });
          continue;
        }

        if (execRes.status === 'Runtime Error') {
          if (overallStatus === 'Accepted') overallStatus = 'Runtime Error';
          testResults.push({
            testNumber: i + 1,
            isSample: tc.isSample,
            passed: false,
            actual: execRes.stdout || '',
            expected: tc.isSample ? tc.expectedOutput : '[HIDDEN]',
            executionTimeMs: execRes.executionTimeMs,
            error: execRes.stderr,
          });
          continue;
        }

        const normalizedActual = normalizeOutput(execRes.stdout);
        const normalizedExpected = normalizeOutput(tc.expectedOutput);
        const isMatch = compareOutputs(execRes.stdout, tc.expectedOutput);

        if (isMatch) {
          testsPassed++;
          testResults.push({
            testNumber: i + 1,
            isSample: tc.isSample,
            passed: true,
            actual: tc.isSample ? normalizedActual : '[HIDDEN]',
            expected: tc.isSample ? normalizedExpected : '[HIDDEN]',
            executionTimeMs: execRes.executionTimeMs,
          });
        } else {
          if (overallStatus === 'Accepted') overallStatus = 'Wrong Answer';
          testResults.push({
            testNumber: i + 1,
            isSample: tc.isSample,
            passed: false,
            actual: tc.isSample ? normalizedActual : '[HIDDEN]',
            expected: tc.isSample ? normalizedExpected : '[HIDDEN]',
            executionTimeMs: execRes.executionTimeMs,
          });
        }
      }

      const contest = await dbStore.getContest(cId);
      const questionMaxMarks =
        contest?.customQuestionMarks?.[questionId] !== undefined
          ? contest.customQuestionMarks[questionId]
          : fullQ.marks || 10;

      const score =
        allTestCases.length > 0
          ? Math.round((testsPassed / allTestCases.length) * questionMaxMarks)
          : 0;

      const submission: Submission = {
        id: `sub_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        contestId: cId,
        participantId,
        participantName: participantName || p.name,
        questionId,
        questionTitle: fullQ.title,
        language,
        code,
        testsPassed,
        totalTests: allTestCases.length,
        score,
        status: overallStatus,
        submittedAt: Date.now(),
        executionTimeMs: totalTime,
        compilerOutput: compilerOutput || undefined,
        testResults,
      };

      await dbStore.addSubmission(submission);

      res.json({
        success: true,
        submission,
        participant: p,
        timeRemainingSeconds: timeRem,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Submission failed' });
    }
  });

  // ================= LEADERBOARD & SUBMISSIONS ================= //
  app.get(['/api/contests/:contestId/leaderboard', '/api/leaderboard'], async (req: Request, res: Response) => {
    try {
      const contestId = req.params.contestId || (req.query.contestId as string) || 'breach-the-bug-round-2';
      const leaderboard = await dbStore.getContestLeaderboard(contestId);
      res.json(leaderboard);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/submissions', async (req: Request, res: Response) => {
    try {
      const contestId = req.query.contestId as string | undefined;
      const participantId = req.query.participantId as string | undefined;
      const questionId = req.query.questionId as string | undefined;

      const subs = await dbStore.getSubmissions(contestId, participantId, questionId);
      res.json(subs);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ================= ADMIN OPERATIONS ================= //
  app.post(['/api/admin/auth', '/api/admin/login'], async (req: Request, res: Response) => {
    const { passcode, password } = req.body;
    const input = passcode || password || '';
    const isValid = await dbStore.verifyAdminPassword(input);
    if (isValid) {
      return res.json({ success: true, token: 'ddc_admin_auth_token_verified' });
    }
    return res.status(401).json({ error: 'Invalid admin passcode (try "aegis2026")' });
  });

  // Admin Contests Management
  app.get('/api/admin/contests', async (req: Request, res: Response) => {
    try {
      const contests = await dbStore.getAllContests();
      res.json(contests);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/admin/contests', async (req: Request, res: Response) => {
    try {
      const saved = await dbStore.saveContest(req.body);
      res.json({ success: true, contest: saved });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.put('/api/admin/contests/:id', async (req: Request, res: Response) => {
    try {
      const saved = await dbStore.saveContest({ ...req.body, id: req.params.id });
      res.json({ success: true, contest: saved });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.delete('/api/admin/contests/:id', async (req: Request, res: Response) => {
    try {
      await dbStore.deleteContest(req.params.id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/admin/contests/:id/publish', async (req: Request, res: Response) => {
    try {
      const published = await dbStore.publishContest(req.params.id);
      res.json({ success: true, contest: published });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/admin/contests/:id/duplicate', async (req: Request, res: Response) => {
    try {
      const dup = await dbStore.duplicateContest(req.params.id);
      res.json({ success: true, contest: dup });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Admin Question Bank Management (supports /api/admin/question-bank and /api/admin/questions)
  app.get(['/api/admin/question-bank', '/api/admin/questions'], async (req: Request, res: Response) => {
    try {
      const questions = await dbStore.getAllBankQuestions();
      res.json(questions);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post(['/api/admin/question-bank', '/api/admin/questions'], async (req: Request, res: Response) => {
    try {
      const saved = await dbStore.saveBankQuestion(req.body);
      res.json({ success: true, question: saved });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.put(['/api/admin/question-bank/:id', '/api/admin/questions/:id'], async (req: Request, res: Response) => {
    try {
      const saved = await dbStore.saveBankQuestion({ ...req.body, id: req.params.id });
      res.json({ success: true, question: saved });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.delete(['/api/admin/question-bank/:id', '/api/admin/questions/:id'], async (req: Request, res: Response) => {
    try {
      await dbStore.deleteBankQuestion(req.params.id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Admin Participants Listing & Actions
  app.get('/api/admin/contests/:id/participants', async (req: Request, res: Response) => {
    try {
      const participants = await dbStore.getAllParticipants(req.params.id);
      res.json(participants);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/admin/contests/:contestId/participants/:participantId/action', async (req: Request, res: Response) => {
    try {
      const { contestId, participantId } = req.params;
      const { action, addMinutes, extraMinutes } = req.body;
      const cId = contestId || 'breach-the-bug-round-2';

      const p = await dbStore.getParticipant(cId, participantId);
      if (!p) return res.status(404).json({ error: 'Participant not found' });

      if (action === 'disqualify') {
        const updated = await dbStore.updateParticipant(cId, participantId, {
          status: 'disqualified',
        });
        return res.json({ success: true, participant: updated });
      }

      if (action === 'reset-timer' || action === 'extend') {
        const mins = addMinutes || extraMinutes || 10;
        const addMs = mins * 60 * 1000;
        const newStartTime = p.startTime + addMs;

        const updated = await dbStore.updateParticipant(cId, participantId, {
          startTime: newStartTime,
          status: 'active',
          endTime: undefined,
        });
        return res.json({ success: true, participant: updated });
      }

      res.status(400).json({ error: `Unknown action "${action}"` });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Admin Live Contest Monitor
  app.get('/api/admin/contests/:id/monitor', async (req: Request, res: Response) => {
    try {
      const contest = await dbStore.getContest(req.params.id);
      const participants = await dbStore.getAllParticipants(req.params.id);
      const submissions = await dbStore.getSubmissions(req.params.id);
      const leaderboard = await dbStore.getContestLeaderboard(req.params.id);
      res.json({ contest, participants, submissions, leaderboard });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Admin Timer & Participant Controls (legacy routes)
  app.post('/api/admin/participant/reset-timer', async (req: Request, res: Response) => {
    try {
      const { contestId, participantId, extraMinutes, addMinutes } = req.body;
      const cId = contestId || 'breach-the-bug-round-2';
      const p = await dbStore.getParticipant(cId, participantId);
      if (!p) return res.status(404).json({ error: 'Participant not found' });

      const mins = addMinutes || extraMinutes || 10;
      const addMs = mins * 60 * 1000;
      const newStartTime = p.startTime + addMs;

      const updated = await dbStore.updateParticipant(cId, participantId, {
        startTime: newStartTime,
        status: 'active',
        endTime: undefined,
      });

      res.json({ success: true, participant: updated });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/admin/participant/disqualify', async (req: Request, res: Response) => {
    try {
      const { contestId, participantId } = req.body;
      const cId = contestId || 'breach-the-bug-round-2';
      const updated = await dbStore.updateParticipant(cId, participantId, {
        status: 'disqualified',
      });
      res.json({ success: true, participant: updated });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Export Contest Data / CSV
  app.get('/api/admin/contests/:id/export', async (req: Request, res: Response) => {
    try {
      const contestId = req.params.id;
      const format = req.query.format || 'json';
      const contest = await dbStore.getContest(contestId);
      const leaderboard = await dbStore.getContestLeaderboard(contestId);
      const submissions = await dbStore.getSubmissions(contestId);

      if (format === 'csv') {
        let csv =
          'Rank,Participant Name,Register Number,Department,Year,Score,Solved,Total Questions,Completion Time,Status\n';
        leaderboard.forEach((entry) => {
          csv += `"${entry.rank}","${entry.name}","${entry.registerNumber}","${entry.department}","${entry.year}","${entry.totalScore}","${entry.solvedCount}","${entry.totalQuestions}","${entry.timeDisplay}","${entry.status}"\n`;
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

  return app;
}
