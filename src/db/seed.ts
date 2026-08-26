import bcrypt from 'bcryptjs';
import * as fs from 'fs';
import * as path from 'path';
import { and, eq, sql } from 'drizzle-orm';
import { db, pool } from './index';
import {
  accounts,
  admins,
  contestParticipants,
  contestQuestions,
  contests,
  questions,
  submissions,
  testCases,
} from './schema';
import { INITIAL_CONTESTS, INITIAL_QUESTION_BANK } from '../../server/questionsData';

export async function createTablesIfNotExist() {
  const statements = [
    `CREATE TABLE IF NOT EXISTS admins (
      id SERIAL PRIMARY KEY,
      username VARCHAR(100) NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role VARCHAR(50) NOT NULL DEFAULT 'superadmin',
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY,
      participant_id VARCHAR(50) NOT NULL UNIQUE,
      name TEXT NOT NULL,
      register_number VARCHAR(50) NOT NULL UNIQUE,
      mobile VARCHAR(30) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      department TEXT NOT NULL,
      year VARCHAR(20) NOT NULL,
      college TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS questions (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      slug TEXT,
      category TEXT,
      difficulty VARCHAR(20) NOT NULL DEFAULT 'Medium',
      tags JSONB NOT NULL DEFAULT '[]'::jsonb,
      description TEXT,
      problem_statement TEXT NOT NULL,
      input_format TEXT,
      output_format TEXT,
      constraints TEXT,
      language VARCHAR(20) NOT NULL DEFAULT 'python',
      starter_code TEXT NOT NULL,
      marks INTEGER NOT NULL DEFAULT 10,
      time_limit_ms INTEGER NOT NULL DEFAULT 2500,
      memory_limit_mb INTEGER NOT NULL DEFAULT 256,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS test_cases (
      id TEXT PRIMARY KEY,
      question_id TEXT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
      input TEXT NOT NULL,
      expected_output TEXT NOT NULL,
      is_sample BOOLEAN NOT NULL DEFAULT FALSE,
      marks INTEGER NOT NULL DEFAULT 0,
      explanation TEXT,
      order_index INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS contests (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      tagline TEXT,
      description TEXT,
      rules JSONB NOT NULL DEFAULT '[]'::jsonb,
      organization TEXT NOT NULL DEFAULT 'Designers Domain Club',
      designed_by TEXT NOT NULL DEFAULT 'Aegis',
      status VARCHAR(30) NOT NULL DEFAULT 'draft',
      duration_minutes INTEGER NOT NULL DEFAULT 45,
      start_date TEXT,
      start_time TEXT,
      end_date TEXT,
      end_time TEXT,
      is_public BOOLEAN NOT NULL DEFAULT TRUE,
      allow_registration BOOLEAN NOT NULL DEFAULT TRUE,
      total_marks INTEGER NOT NULL DEFAULT 50,
      total_questions INTEGER NOT NULL DEFAULT 5,
      custom_question_marks JSONB NOT NULL DEFAULT '{}'::jsonb,
      question_snapshots JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS contest_questions (
      id SERIAL PRIMARY KEY,
      contest_id TEXT NOT NULL REFERENCES contests(id) ON DELETE CASCADE,
      question_id TEXT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
      display_order INTEGER NOT NULL DEFAULT 0,
      marks_override INTEGER,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS contest_participants (
      id TEXT PRIMARY KEY,
      contest_id TEXT NOT NULL REFERENCES contests(id) ON DELETE CASCADE,
      participant_id VARCHAR(50) NOT NULL,
      account_id TEXT,
      name TEXT NOT NULL,
      register_number VARCHAR(50) NOT NULL,
      email VARCHAR(255) NOT NULL,
      department TEXT NOT NULL,
      year VARCHAR(20) NOT NULL,
      college TEXT,
      start_time_epoch TEXT NOT NULL,
      end_time_epoch TEXT,
      status VARCHAR(30) NOT NULL DEFAULT 'active',
      score INTEGER NOT NULL DEFAULT 0,
      solved_count INTEGER NOT NULL DEFAULT 0,
      completion_time_seconds INTEGER NOT NULL DEFAULT 0,
      registered_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS submissions (
      id TEXT PRIMARY KEY,
      contest_id TEXT NOT NULL REFERENCES contests(id) ON DELETE CASCADE,
      participant_id VARCHAR(50) NOT NULL,
      participant_name TEXT NOT NULL,
      question_id TEXT NOT NULL,
      question_title TEXT NOT NULL,
      language VARCHAR(20) NOT NULL,
      code TEXT NOT NULL,
      tests_passed INTEGER NOT NULL DEFAULT 0,
      total_tests INTEGER NOT NULL DEFAULT 0,
      score INTEGER NOT NULL DEFAULT 0,
      status VARCHAR(50) NOT NULL,
      execution_time_ms INTEGER NOT NULL DEFAULT 0,
      compiler_output TEXT,
      test_results JSONB NOT NULL DEFAULT '[]'::jsonb,
      submitted_at_epoch TEXT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )`,
    // Column Migrations (safe idempotent alter statements)
    `ALTER TABLE contests ADD COLUMN IF NOT EXISTS tagline TEXT`,
    `ALTER TABLE contests ADD COLUMN IF NOT EXISTS description TEXT`,
    `ALTER TABLE contests ADD COLUMN IF NOT EXISTS rules JSONB NOT NULL DEFAULT '[]'::jsonb`,
    `ALTER TABLE contests ADD COLUMN IF NOT EXISTS organization TEXT NOT NULL DEFAULT 'Designers Domain Club'`,
    `ALTER TABLE contests ADD COLUMN IF NOT EXISTS designed_by TEXT NOT NULL DEFAULT 'Aegis'`,
    `ALTER TABLE contests ADD COLUMN IF NOT EXISTS status VARCHAR(30) NOT NULL DEFAULT 'draft'`,
    `ALTER TABLE contests ADD COLUMN IF NOT EXISTS duration_minutes INTEGER NOT NULL DEFAULT 45`,
    `ALTER TABLE contests ADD COLUMN IF NOT EXISTS start_date TEXT`,
    `ALTER TABLE contests ADD COLUMN IF NOT EXISTS start_time TEXT`,
    `ALTER TABLE contests ADD COLUMN IF NOT EXISTS end_date TEXT`,
    `ALTER TABLE contests ADD COLUMN IF NOT EXISTS end_time TEXT`,
    `ALTER TABLE contests ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT TRUE`,
    `ALTER TABLE contests ADD COLUMN IF NOT EXISTS allow_registration BOOLEAN NOT NULL DEFAULT TRUE`,
    `ALTER TABLE contests ADD COLUMN IF NOT EXISTS total_marks INTEGER NOT NULL DEFAULT 50`,
    `ALTER TABLE contests ADD COLUMN IF NOT EXISTS total_questions INTEGER NOT NULL DEFAULT 5`,
    `ALTER TABLE contests ADD COLUMN IF NOT EXISTS custom_question_marks JSONB NOT NULL DEFAULT '{}'::jsonb`,
    `ALTER TABLE contests ADD COLUMN IF NOT EXISTS question_snapshots JSONB NOT NULL DEFAULT '{}'::jsonb`,
    `ALTER TABLE contests ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT NOW()`,
    `ALTER TABLE contests ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT NOW()`,

    `ALTER TABLE questions ADD COLUMN IF NOT EXISTS slug TEXT`,
    `ALTER TABLE questions ADD COLUMN IF NOT EXISTS category TEXT`,
    `ALTER TABLE questions ADD COLUMN IF NOT EXISTS difficulty VARCHAR(20) NOT NULL DEFAULT 'Medium'`,
    `ALTER TABLE questions ADD COLUMN IF NOT EXISTS tags JSONB NOT NULL DEFAULT '[]'::jsonb`,
    `ALTER TABLE questions ADD COLUMN IF NOT EXISTS description TEXT`,
    `ALTER TABLE questions ADD COLUMN IF NOT EXISTS problem_statement TEXT`,
    `ALTER TABLE questions ADD COLUMN IF NOT EXISTS input_format TEXT`,
    `ALTER TABLE questions ADD COLUMN IF NOT EXISTS output_format TEXT`,
    `ALTER TABLE questions ADD COLUMN IF NOT EXISTS constraints TEXT`,
    `ALTER TABLE questions ADD COLUMN IF NOT EXISTS language VARCHAR(20) NOT NULL DEFAULT 'python'`,
    `ALTER TABLE questions ADD COLUMN IF NOT EXISTS starter_code TEXT`,
    `ALTER TABLE questions ADD COLUMN IF NOT EXISTS marks INTEGER NOT NULL DEFAULT 10`,
    `ALTER TABLE questions ADD COLUMN IF NOT EXISTS time_limit_ms INTEGER NOT NULL DEFAULT 2500`,
    `ALTER TABLE questions ADD COLUMN IF NOT EXISTS memory_limit_mb INTEGER NOT NULL DEFAULT 256`,
    `ALTER TABLE questions ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT NOW()`,
    `ALTER TABLE questions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT NOW()`,

    `ALTER TABLE contest_questions ADD COLUMN IF NOT EXISTS display_order INTEGER NOT NULL DEFAULT 0`,
    `ALTER TABLE contest_questions ADD COLUMN IF NOT EXISTS marks_override INTEGER`,

    `ALTER TABLE test_cases ADD COLUMN IF NOT EXISTS order_index INTEGER NOT NULL DEFAULT 0`,
    `ALTER TABLE test_cases ADD COLUMN IF NOT EXISTS is_sample BOOLEAN NOT NULL DEFAULT FALSE`,
    `ALTER TABLE test_cases ADD COLUMN IF NOT EXISTS marks INTEGER NOT NULL DEFAULT 0`,
    `ALTER TABLE test_cases ADD COLUMN IF NOT EXISTS explanation TEXT`,

    `ALTER TABLE contest_participants ADD COLUMN IF NOT EXISTS account_id TEXT`,
    `ALTER TABLE contest_participants ADD COLUMN IF NOT EXISTS college TEXT`,
    `ALTER TABLE contest_participants ADD COLUMN IF NOT EXISTS status VARCHAR(30) NOT NULL DEFAULT 'active'`,
    `ALTER TABLE contest_participants ADD COLUMN IF NOT EXISTS score INTEGER NOT NULL DEFAULT 0`,
    `ALTER TABLE contest_participants ADD COLUMN IF NOT EXISTS solved_count INTEGER NOT NULL DEFAULT 0`,
    `ALTER TABLE contest_participants ADD COLUMN IF NOT EXISTS completion_time_seconds INTEGER NOT NULL DEFAULT 0`,
    `ALTER TABLE contest_participants ADD COLUMN IF NOT EXISTS start_time_epoch TEXT`,
    `ALTER TABLE contest_participants ADD COLUMN IF NOT EXISTS end_time_epoch TEXT`,

    `ALTER TABLE submissions ADD COLUMN IF NOT EXISTS execution_time_ms INTEGER NOT NULL DEFAULT 0`,
    `ALTER TABLE submissions ADD COLUMN IF NOT EXISTS compiler_output TEXT`,
    `ALTER TABLE submissions ADD COLUMN IF NOT EXISTS test_results JSONB NOT NULL DEFAULT '[]'::jsonb`,
    `ALTER TABLE submissions ADD COLUMN IF NOT EXISTS submitted_at_epoch TEXT`,

    `CREATE INDEX IF NOT EXISTS idx_accounts_email ON accounts(email)`,
    `CREATE INDEX IF NOT EXISTS idx_accounts_reg_no ON accounts(register_number)`,
    `CREATE INDEX IF NOT EXISTS idx_accounts_participant_id ON accounts(participant_id)`,
    `CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON questions(difficulty)`,
    `CREATE INDEX IF NOT EXISTS idx_questions_language ON questions(language)`,
    `CREATE INDEX IF NOT EXISTS idx_test_cases_question_id ON test_cases(question_id)`,
    `CREATE INDEX IF NOT EXISTS idx_contests_status ON contests(status)`,
    `CREATE INDEX IF NOT EXISTS idx_contests_is_public ON contests(is_public)`,
    `CREATE INDEX IF NOT EXISTS idx_cq_contest_id ON contest_questions(contest_id)`,
    `CREATE INDEX IF NOT EXISTS idx_cp_contest_id ON contest_participants(contest_id)`,
    `CREATE INDEX IF NOT EXISTS idx_cp_participant_id ON contest_participants(participant_id)`,
    `CREATE INDEX IF NOT EXISTS idx_submissions_contest_id ON submissions(contest_id)`,
    `CREATE INDEX IF NOT EXISTS idx_submissions_participant_id ON submissions(participant_id)`,
  ];

  for (const stmt of statements) {
    try {
      await pool.query(stmt);
    } catch (e: any) {
      console.warn('Notice executing DDL migration statement:', stmt.slice(0, 40), e?.message);
    }
  }
}

export async function seedDatabase() {
  console.log('🔄 Starting idempotent database synchronization and migration...');

  // 0. Auto-create all tables if they don't exist yet in PostgreSQL / Neon
  try {
    await createTablesIfNotExist();
    console.log('✅ PostgreSQL Schema tables verified / provisioned.');
  } catch (tableErr) {
    console.error('Notice on table initialization:', tableErr);
  }

  // 1. Seed or update Admin Account
  try {
    const defaultAdminPass = process.env.ADMIN_PASSWORD || 'aegis2026';
    const hashedAdminPass = await bcrypt.hash(defaultAdminPass, 10);

    const existingAdmin = await db
      .select()
      .from(admins)
      .where(eq(admins.username, 'admin'))
      .limit(1);

    if (existingAdmin.length === 0) {
      await db.insert(admins).values({
        username: 'admin',
        passwordHash: hashedAdminPass,
        role: 'superadmin',
      });
      console.log('✅ Admin account provisioned: username=admin');
    } else {
      // Keep admin password synchronized if env changes
      await db
        .update(admins)
        .set({ passwordHash: hashedAdminPass, updatedAt: new Date() })
        .where(eq(admins.username, 'admin'));
      console.log('✅ Admin credentials synchronized');
    }
  } catch (adminErr) {
    console.warn('Notice syncing admin account:', (adminErr as any)?.message);
  }

  // 2. Seed / Upsert Questions and Test Cases
  try {
    for (const q of INITIAL_QUESTION_BANK) {
      await db
        .insert(questions)
        .values({
          id: q.id,
          title: q.title,
          slug: q.slug || q.id,
          category: q.category || 'General',
          difficulty: q.difficulty || 'Medium',
          tags: q.tags || [],
          description: q.description || '',
          problemStatement: q.problemStatement,
          inputFormat: q.inputFormat || '',
          outputFormat: q.outputFormat || '',
          constraints: q.constraints || '',
          language: q.language,
          starterCode: q.starterCode,
          marks: q.marks || 10,
          timeLimitMs: q.timeLimitMs || 2500,
          memoryLimitMb: 256,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: questions.id,
          set: {
            title: q.title,
            slug: q.slug || q.id,
            category: q.category || 'General',
            difficulty: q.difficulty || 'Medium',
            tags: q.tags || [],
            description: q.description || '',
            problemStatement: q.problemStatement,
            inputFormat: q.inputFormat || '',
            outputFormat: q.outputFormat || '',
            constraints: q.constraints || '',
            language: q.language,
            starterCode: q.starterCode,
            marks: q.marks || 10,
            timeLimitMs: q.timeLimitMs || 2500,
            updatedAt: new Date(),
          },
        });

      // Seed test cases for question
      const allTests = [
        ...(q.sampleTestCases || []).map((t, idx) => ({ ...t, isSample: true, orderIndex: idx })),
        ...(q.hiddenTestCases || []).map((t, idx) => ({
          ...t,
          isSample: false,
          orderIndex: (q.sampleTestCases?.length || 0) + idx,
        })),
      ];

      for (const t of allTests) {
        await db
          .insert(testCases)
          .values({
            id: t.id,
            questionId: q.id,
            input: t.input,
            expectedOutput: t.expectedOutput,
            isSample: t.isSample,
            marks: Math.round(t.marks || 0),
            explanation: t.explanation || null,
            orderIndex: t.orderIndex,
          })
          .onConflictDoUpdate({
            target: testCases.id,
            set: {
              input: t.input,
              expectedOutput: t.expectedOutput,
              isSample: t.isSample,
              marks: Math.round(t.marks || 0),
              explanation: t.explanation || null,
              orderIndex: t.orderIndex,
            },
          });
      }
    }
    console.log(`✅ ${INITIAL_QUESTION_BANK.length} Question Bank challenges & test cases synchronized`);
  } catch (qErr) {
    console.warn('Notice syncing question bank:', (qErr as any)?.message);
  }

  // 3. Seed Contests & Relationships
  try {
    for (const c of INITIAL_CONTESTS) {
      // Generate snapshot map for contest
      const snapshots: Record<string, any> = {};
      for (const qId of c.questionIds) {
        const q = INITIAL_QUESTION_BANK.find((item) => item.id === qId);
        if (q) snapshots[qId] = q;
      }

      await db
        .insert(contests)
        .values({
          id: c.id,
          title: c.title,
          tagline: c.tagline || '',
          description: c.description || '',
          rules: c.rules || [],
          organization: c.organization || 'Designers Domain Club',
          designedBy: c.designedBy || 'Aegis',
          status: c.status || 'active',
          durationMinutes: c.durationMinutes || 45,
          startTime: c.startTime ? String(c.startTime) : null,
          endTime: c.endTime ? String(c.endTime) : null,
          isPublic: c.isPublic !== false,
          allowRegistration: c.allowRegistration !== false,
          totalMarks: c.totalMarks || 50,
          totalQuestions: c.questionIds.length,
          customQuestionMarks: c.customQuestionMarks || {},
          questionSnapshots: snapshots,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: contests.id,
          set: {
            title: c.title,
            tagline: c.tagline || '',
            description: c.description || '',
            rules: c.rules || [],
            organization: c.organization || 'Designers Domain Club',
            designedBy: c.designedBy || 'Aegis',
            status: c.status || 'active',
            durationMinutes: c.durationMinutes || 45,
            startTime: c.startTime ? String(c.startTime) : null,
            endTime: c.endTime ? String(c.endTime) : null,
            isPublic: c.isPublic !== false,
            allowRegistration: c.allowRegistration !== false,
            totalMarks: c.totalMarks || 50,
            totalQuestions: c.questionIds.length,
            customQuestionMarks: c.customQuestionMarks || {},
            questionSnapshots: snapshots,
            updatedAt: new Date(),
          },
        });

      // Populate contest_questions join table
      for (let i = 0; i < c.questionIds.length; i++) {
        const qId = c.questionIds[i];
        const existingLink = await db
          .select()
          .from(contestQuestions)
          .where(
            and(
              eq(contestQuestions.contestId, c.id),
              eq(contestQuestions.questionId, qId)
            )
          )
          .limit(1);

        if (existingLink.length === 0) {
          await db.insert(contestQuestions).values({
            contestId: c.id,
            questionId: qId,
            displayOrder: i + 1,
            marksOverride: c.customQuestionMarks ? c.customQuestionMarks[qId] : null,
          });
        } else {
          await db
            .update(contestQuestions)
            .set({
              displayOrder: i + 1,
              marksOverride: c.customQuestionMarks ? c.customQuestionMarks[qId] : null,
            })
            .where(eq(contestQuestions.id, existingLink[0].id));
        }
      }
    }
    console.log(`✅ ${INITIAL_CONTESTS.length} Contests and question associations synchronized`);
  } catch (cErr) {
    console.warn('Notice syncing contests:', (cErr as any)?.message);
  }

  // 4. Migrate any existing disk cache accounts/participants/submissions (if real non-demo)
  const dataFilePath = path.join(process.cwd(), 'data', 'platform_store.json');
  if (fs.existsSync(dataFilePath)) {
    try {
      const raw = fs.readFileSync(dataFilePath, 'utf8');
      const parsed = JSON.parse(raw);
      const demoAccountIds = new Set(['acc_101', 'acc_102', 'DDC-2026-101', 'DDC-2026-102']);

      if (parsed.accounts && typeof parsed.accounts === 'object') {
        for (const [pId, acc] of Object.entries(parsed.accounts) as [string, any][]) {
          if (demoAccountIds.has(acc.id) || demoAccountIds.has(pId) || acc.email?.endsWith('@college.edu')) {
            continue;
          }
          let passHash = acc.password ? await bcrypt.hash(acc.password, 10) : '$2a$10$demoDefaultPassHash';
          if (acc.password?.startsWith('$2a$') || acc.password?.startsWith('$2b$')) {
            passHash = acc.password;
          }

          await db
            .insert(accounts)
            .values({
              id: acc.id || `acc_${acc.participantId}`,
              participantId: acc.participantId,
              name: acc.name,
              registerNumber: acc.registerNumber,
              mobile: acc.mobile || '',
              email: acc.email,
              department: acc.department || 'General',
              year: acc.year || '1',
              college: acc.college || 'College',
              passwordHash: passHash,
            })
            .onConflictDoNothing();
        }
      }

      if (parsed.participants && typeof parsed.participants === 'object') {
        for (const [key, part] of Object.entries(parsed.participants) as [string, any][]) {
          if (
            demoAccountIds.has(part.id) ||
            demoAccountIds.has(part.participantId) ||
            part.email?.endsWith('@college.edu') ||
            part.contestId === 'breach-the-bug-2026' ||
            part.contestId === 'code-clash-2026'
          ) {
            continue;
          }

          await db
            .insert(contestParticipants)
            .values({
              id: `${part.contestId}:${part.participantId}`,
              contestId: part.contestId,
              participantId: part.participantId,
              accountId: `acc_${part.participantId}`,
              name: part.name,
              registerNumber: part.registerNumber,
              email: part.email,
              department: part.department,
              year: part.year,
              college: part.college,
              startTime: String(part.startTime || Date.now()),
              endTime: part.endTime ? String(part.endTime) : null,
              status: part.status || 'active',
              score: part.totalScore || part.score || 0,
              solvedCount: part.solvedCount || 0,
              completionTimeSeconds: part.completionTimeSeconds || 0,
            })
            .onConflictDoNothing();
        }
      }

      if (Array.isArray(parsed.submissions)) {
        for (const sub of parsed.submissions) {
          if (demoAccountIds.has(sub.participantId)) continue;
          await db
            .insert(submissions)
            .values({
              id: sub.id,
              contestId: sub.contestId,
              participantId: sub.participantId,
              participantName: sub.participantName,
              questionId: sub.questionId,
              questionTitle: sub.questionTitle,
              language: sub.language,
              code: sub.code,
              testsPassed: sub.testsPassed,
              totalTests: sub.totalTests,
              score: sub.score,
              status: sub.status,
              executionTimeMs: sub.executionTimeMs || 0,
              compilerOutput: sub.compilerOutput || null,
              testResults: sub.testResults || [],
              submittedAt: String(sub.submittedAt || Date.now()),
            })
            .onConflictDoNothing();
        }
      }
    } catch (err) {
      console.warn('Notice: Local disk cache migration encountered non-fatal error:', err);
    }
  }

  console.log('🌟 PostgreSQL Database Seed & Migration completed successfully!');
}
