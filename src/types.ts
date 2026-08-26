export type SupportedLanguage = 'python' | 'c';

export type SubmissionStatus =
  | 'Accepted'
  | 'Wrong Answer'
  | 'Compilation Error'
  | 'Runtime Error'
  | 'Time Limit Exceeded'
  | 'Memory Limit Exceeded';

export type ContestStatus = 'draft' | 'upcoming' | 'active' | 'ended' | 'archived';
export type QuestionDifficulty = 'Easy' | 'Medium' | 'Hard';

export interface TestCase {
  id: string;
  input: string;
  expectedOutput: string;
  isSample: boolean;
  marks: number;
  explanation?: string;
}

export interface Question {
  id: string;
  title: string;
  slug?: string;
  category?: string;
  difficulty?: QuestionDifficulty;
  tags?: string[];
  description: string;
  problemStatement: string;
  inputFormat: string;
  outputFormat: string;
  constraints: string;
  language: SupportedLanguage;
  starterCode: string;
  solutionCode?: string;
  marks: number;
  timeLimitMs: number;
  sampleTestCases: TestCase[];
  createdAt?: number;
  updatedAt?: number;
}

export interface FullQuestion extends Question {
  hiddenTestCases: TestCase[];
}

export interface Contest {
  id: string;
  title: string;
  tagline: string;
  description: string;
  rules: string[];
  organization: string;
  designedBy: string;
  status: ContestStatus;
  durationMinutes: number;
  startDate?: string;
  startTime?: number;
  endDate?: string;
  endTime?: number;
  isPublic: boolean;
  accessCode?: string;
  allowRegistration: boolean;
  questionIds: string[];
  customQuestionMarks?: { [questionId: string]: number };
  questionSnapshots?: { [questionId: string]: FullQuestion };
  totalMarks: number;
  totalQuestions: number;
  participantCount?: number;
  submissionCount?: number;
  createdAt: number;
  updatedAt: number;
}

export interface ParticipantAccount {
  id: string;
  participantId: string;
  name: string;
  registerNumber: string;
  mobile: string;
  email: string;
  department: string;
  year: string;
  college: string;
  createdAt: number;
  updatedAt: number;
}

export interface ParticipantResult {
  contestId: string;
  contestTitle: string;
  totalScore: number;
  totalMarks: number;
  solvedCount: number;
  totalQuestions: number;
  completionTimeSeconds: number;
  timeDisplay: string;
  rank: number;
  status: 'active' | 'completed' | 'disqualified';
  lastSubmissionTime?: number;
}

export interface Participant {
  id: string;
  contestId: string;
  participantId: string;
  name: string;
  registerNumber: string;
  department: string;
  year: string;
  college?: string;
  mobile?: string;
  email: string;
  createdAt: number;
  startTime: number;
  endTime?: number;
  status: 'active' | 'completed' | 'disqualified';
  totalScore: number;
  solvedCount: number;
  completionTimeSeconds?: number;
}

export interface Submission {
  id: string;
  contestId: string;
  participantId: string;
  participantName: string;
  questionId: string;
  questionTitle: string;
  language: SupportedLanguage;
  code: string;
  testsPassed: number;
  totalTests: number;
  score: number;
  status: SubmissionStatus;
  submittedAt: number;
  executionTimeMs: number;
  compilerOutput?: string;
  testResults?: {
    testNumber: number;
    isSample: boolean;
    passed: boolean;
    input?: string;
    expected?: string;
    actual?: string;
    error?: string;
    executionTimeMs: number;
  }[];
}

export interface LeaderboardEntry {
  rank: number;
  contestId: string;
  participantId: string;
  name: string;
  registerNumber: string;
  department: string;
  year: string;
  totalScore: number;
  solvedCount: number;
  totalQuestions: number;
  timeDisplay: string; // e.g. "18:42"
  completionTimeSeconds: number;
  status: 'active' | 'completed' | 'disqualified';
  lastSubmissionTime: number;
  questionScores: { [questionId: string]: number };
}

export interface RunResult {
  status: SubmissionStatus;
  output: string;
  error?: string;
  compilerOutput?: string;
  executionTimeMs: number;
  testResults: {
    testNumber: number;
    isSample: boolean;
    passed: boolean;
    input?: string;
    expected?: string;
    actual?: string;
    error?: string;
    executionTimeMs: number;
  }[];
  passedCount: number;
  totalCount: number;
}
