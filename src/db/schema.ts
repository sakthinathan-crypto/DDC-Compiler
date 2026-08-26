import { relations } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';

// 1. Admin Accounts
export const admins = pgTable('admins', {
  id: serial('id').primaryKey(),
  username: varchar('username', { length: 100 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: varchar('role', { length: 50 }).notNull().default('superadmin'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 2. Participant Accounts (Global user profile across contests)
export const accounts = pgTable(
  'accounts',
  {
    id: text('id').primaryKey(), // acc_... or participantId
    participantId: varchar('participant_id', { length: 50 }).notNull().unique(),
    name: text('name').notNull(),
    registerNumber: varchar('register_number', { length: 50 }).notNull().unique(),
    mobile: varchar('mobile', { length: 30 }).notNull(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    department: text('department').notNull(),
    year: varchar('year', { length: 20 }).notNull(),
    college: text('college').notNull(),
    passwordHash: text('password_hash').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('idx_accounts_email').on(table.email),
    index('idx_accounts_reg_no').on(table.registerNumber),
    index('idx_accounts_participant_id').on(table.participantId),
  ]
);

// 3. Question Bank
export const questions = pgTable(
  'questions',
  {
    id: text('id').primaryKey(), // e.g. btb2-q1, btb3-q1
    title: text('title').notNull(),
    slug: text('slug'),
    category: text('category'),
    difficulty: varchar('difficulty', { length: 20 }).notNull().default('Medium'),
    tags: jsonb('tags').$type<string[]>().default([]).notNull(),
    description: text('description'),
    problemStatement: text('problem_statement').notNull(),
    inputFormat: text('input_format'),
    outputFormat: text('output_format'),
    constraints: text('constraints'),
    language: varchar('language', { length: 20 }).notNull().default('python'), // 'c' | 'python'
    starterCode: text('starter_code').notNull(),
    marks: integer('marks').notNull().default(10),
    timeLimitMs: integer('time_limit_ms').default(2500).notNull(),
    memoryLimitMb: integer('memory_limit_mb').default(256).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('idx_questions_difficulty').on(table.difficulty),
    index('idx_questions_language').on(table.language),
  ]
);

// 4. Test Cases
export const testCases = pgTable(
  'test_cases',
  {
    id: text('id').primaryKey(),
    questionId: text('question_id')
      .notNull()
      .references(() => questions.id, { onDelete: 'cascade' }),
    input: text('input').notNull(),
    expectedOutput: text('expected_output').notNull(),
    isSample: boolean('is_sample').notNull().default(false),
    marks: integer('marks').default(0).notNull(),
    explanation: text('explanation'),
    orderIndex: integer('order_index').default(0).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('idx_test_cases_question_id').on(table.questionId),
    index('idx_test_cases_is_sample').on(table.isSample),
  ]
);

// 5. Contests
export const contests = pgTable(
  'contests',
  {
    id: text('id').primaryKey(), // e.g. breach-the-bug-round-2
    title: text('title').notNull(),
    tagline: text('tagline'),
    description: text('description'),
    rules: jsonb('rules').$type<string[]>().default([]).notNull(),
    organization: text('organization').default('Designers Domain Club').notNull(),
    designedBy: text('designed_by').default('Aegis').notNull(),
    status: varchar('status', { length: 30 }).notNull().default('draft'), // 'draft' | 'active' | 'completed' | 'archived'
    durationMinutes: integer('duration_minutes').notNull().default(45),
    startDate: text('start_date'),
    startTime: text('start_time'),
    endDate: text('end_date'),
    endTime: text('end_time'),
    isPublic: boolean('is_public').default(true).notNull(),
    allowRegistration: boolean('allow_registration').default(true).notNull(),
    totalMarks: integer('total_marks').default(50).notNull(),
    totalQuestions: integer('total_questions').default(5).notNull(),
    customQuestionMarks: jsonb('custom_question_marks').$type<Record<string, number>>().default({}),
    questionSnapshots: jsonb('question_snapshots').$type<Record<string, any>>().default({}),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('idx_contests_status').on(table.status),
    index('idx_contests_is_public').on(table.isPublic),
  ]
);

// 6. Contest Question Relationships
export const contestQuestions = pgTable(
  'contest_questions',
  {
    id: serial('id').primaryKey(),
    contestId: text('contest_id')
      .notNull()
      .references(() => contests.id, { onDelete: 'cascade' }),
    questionId: text('question_id')
      .notNull()
      .references(() => questions.id, { onDelete: 'cascade' }),
    displayOrder: integer('display_order').notNull().default(0),
    marksOverride: integer('marks_override'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('idx_cq_contest_id').on(table.contestId),
    index('idx_cq_question_id').on(table.questionId),
  ]
);

// 7. Contest Participants (Session per contest)
export const contestParticipants = pgTable(
  'contest_participants',
  {
    id: text('id').primaryKey(), // `${contestId}:${participantId}`
    contestId: text('contest_id')
      .notNull()
      .references(() => contests.id, { onDelete: 'cascade' }),
    participantId: varchar('participant_id', { length: 50 }).notNull(),
    accountId: text('account_id'),
    name: text('name').notNull(),
    registerNumber: varchar('register_number', { length: 50 }).notNull(),
    email: varchar('email', { length: 255 }).notNull(),
    department: text('department').notNull(),
    year: varchar('year', { length: 20 }).notNull(),
    college: text('college'),
    startTime: text('start_time_epoch').notNull(), // epoch ms as string to avoid big integer serialization issues
    endTime: text('end_time_epoch'),
    status: varchar('status', { length: 30 }).notNull().default('active'), // 'active' | 'completed' | 'disqualified'
    score: integer('score').default(0).notNull(),
    solvedCount: integer('solved_count').default(0).notNull(),
    completionTimeSeconds: integer('completion_time_seconds').default(0).notNull(),
    registeredAt: timestamp('registered_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('idx_cp_contest_id').on(table.contestId),
    index('idx_cp_participant_id').on(table.participantId),
    index('idx_cp_score').on(table.score),
  ]
);

// 8. Submissions
export const submissions = pgTable(
  'submissions',
  {
    id: text('id').primaryKey(), // sub_...
    contestId: text('contest_id')
      .notNull()
      .references(() => contests.id, { onDelete: 'cascade' }),
    participantId: varchar('participant_id', { length: 50 }).notNull(),
    participantName: text('participant_name').notNull(),
    questionId: text('question_id').notNull(),
    questionTitle: text('question_title').notNull(),
    language: varchar('language', { length: 20 }).notNull(),
    code: text('code').notNull(),
    testsPassed: integer('tests_passed').notNull().default(0),
    totalTests: integer('total_tests').notNull().default(0),
    score: integer('score').notNull().default(0),
    status: varchar('status', { length: 50 }).notNull(),
    executionTimeMs: integer('execution_time_ms').default(0).notNull(),
    compilerOutput: text('compiler_output'),
    testResults: jsonb('test_results').$type<any[]>().default([]).notNull(),
    submittedAt: text('submitted_at_epoch').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('idx_submissions_contest_id').on(table.contestId),
    index('idx_submissions_participant_id').on(table.participantId),
    index('idx_submissions_question_id').on(table.questionId),
  ]
);

// Relations
export const questionsRelations = relations(questions, ({ many }) => ({
  testCases: many(testCases),
  contestLinks: many(contestQuestions),
}));

export const testCasesRelations = relations(testCases, ({ one }) => ({
  question: one(questions, {
    fields: [testCases.questionId],
    references: [questions.id],
  }),
}));

export const contestsRelations = relations(contests, ({ many }) => ({
  contestQuestions: many(contestQuestions),
  participants: many(contestParticipants),
  submissions: many(submissions),
}));

export const contestQuestionsRelations = relations(contestQuestions, ({ one }) => ({
  contest: one(contests, {
    fields: [contestQuestions.contestId],
    references: [contests.id],
  }),
  question: one(questions, {
    fields: [contestQuestions.questionId],
    references: [questions.id],
  }),
}));

export const contestParticipantsRelations = relations(contestParticipants, ({ one }) => ({
  contest: one(contests, {
    fields: [contestParticipants.contestId],
    references: [contests.id],
  }),
}));

export const submissionsRelations = relations(submissions, ({ one }) => ({
  contest: one(contests, {
    fields: [submissions.contestId],
    references: [contests.id],
  }),
}));
