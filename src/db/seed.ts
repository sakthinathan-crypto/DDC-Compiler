import bcrypt from 'bcryptjs';
import * as fs from 'fs';
import * as path from 'path';
import { and, eq } from 'drizzle-orm';
import { db } from './index';
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

export async function seedDatabase() {
  console.log('🔄 Starting idempotent database synchronization and migration...');

  // 1. Seed or update Admin Account
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

  // 2. Seed / Upsert Questions and Test Cases
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

  // 3. Seed Contests & Relationships
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
