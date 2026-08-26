-- ==============================================================================
-- DESIGNERS DOMAIN CLUB COMPILER (DDC COMPILER)
-- POSTGRESQL SCHEMA DUMP & COMPLETE SEED DATA
-- Compatible with: Neon, Supabase, Cloud SQL, Railway, Render, Local Postgres, Docker
-- ==============================================================================

-- 1. DROP EXISTING TABLES IF NEEDED
DROP TABLE IF EXISTS submissions CASCADE;
DROP TABLE IF EXISTS contest_participants CASCADE;
DROP TABLE IF EXISTS contest_questions CASCADE;
DROP TABLE IF EXISTS test_cases CASCADE;
DROP TABLE IF EXISTS questions CASCADE;
DROP TABLE IF EXISTS contests CASCADE;
DROP TABLE IF EXISTS accounts CASCADE;
DROP TABLE IF EXISTS admins CASCADE;

-- 2. CREATE EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 3. ADMINS TABLE
CREATE TABLE admins (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'superadmin',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Default Admin Credential: username: admin | password: (BCrypt hash for 'aegis2026')
INSERT INTO admins (username, password_hash, role)
VALUES ('admin', '$2a$10$w09aV4Y18gX7gY0uD4uW.eaZfWlqK/tI7g1vL9g4E7l8E.oW1l8K6', 'superadmin')
ON CONFLICT (username) DO NOTHING;

-- 4. PARTICIPANT ACCOUNTS TABLE
CREATE TABLE accounts (
    id TEXT PRIMARY KEY,
    participant_id VARCHAR(50) NOT NULL UNIQUE,
    name TEXT NOT NULL,
    register_number VARCHAR(100) NOT NULL UNIQUE,
    mobile VARCHAR(50) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    department VARCHAR(100) NOT NULL,
    year VARCHAR(50) NOT NULL,
    college TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX idx_accounts_part_id ON accounts(participant_id);
CREATE INDEX idx_accounts_reg_no ON accounts(register_number);
CREATE INDEX idx_accounts_email ON accounts(email);

-- 5. CONTESTS TABLE
CREATE TABLE contests (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    tagline TEXT,
    description TEXT,
    rules JSONB DEFAULT '[]'::jsonb,
    organization VARCHAR(150) NOT NULL DEFAULT 'Designers Domain Club',
    designed_by VARCHAR(150) NOT NULL DEFAULT 'Aegis',
    status VARCHAR(50) NOT NULL DEFAULT 'draft',
    duration_minutes INT NOT NULL DEFAULT 45,
    start_time TEXT,
    end_time TEXT,
    is_public BOOLEAN NOT NULL DEFAULT true,
    allow_registration BOOLEAN NOT NULL DEFAULT true,
    total_marks INT NOT NULL DEFAULT 50,
    total_questions INT NOT NULL DEFAULT 5,
    custom_question_marks JSONB DEFAULT '{}'::jsonb,
    question_snapshots JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX idx_contests_status ON contests(status);

-- 6. QUESTION BANK TABLE
CREATE TABLE questions (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    slug VARCHAR(255),
    category VARCHAR(100),
    difficulty VARCHAR(50) NOT NULL DEFAULT 'Medium',
    tags JSONB DEFAULT '[]'::jsonb,
    description TEXT,
    problem_statement TEXT NOT NULL,
    input_format TEXT,
    output_format TEXT,
    constraints TEXT,
    language VARCHAR(50) NOT NULL,
    starter_code TEXT NOT NULL,
    marks INT NOT NULL DEFAULT 10,
    time_limit_ms INT NOT NULL DEFAULT 2500,
    memory_limit_mb INT NOT NULL DEFAULT 256,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX idx_questions_lang ON questions(language);
CREATE INDEX idx_questions_diff ON questions(difficulty);

-- 7. TEST CASES TABLE
CREATE TABLE test_cases (
    id TEXT PRIMARY KEY,
    question_id TEXT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    input TEXT NOT NULL,
    expected_output TEXT NOT NULL,
    is_sample BOOLEAN NOT NULL DEFAULT false,
    marks INT NOT NULL DEFAULT 0,
    explanation TEXT,
    order_index INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX idx_testcases_qid ON test_cases(question_id);

-- 8. CONTEST_QUESTIONS JOIN TABLE
CREATE TABLE contest_questions (
    id SERIAL PRIMARY KEY,
    contest_id TEXT NOT NULL REFERENCES contests(id) ON DELETE CASCADE,
    question_id TEXT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    display_order INT NOT NULL DEFAULT 1,
    marks_override INT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE UNIQUE INDEX idx_cq_pair ON contest_questions(contest_id, question_id);

-- 9. CONTEST PARTICIPANTS / SESSIONS TABLE
CREATE TABLE contest_participants (
    id TEXT PRIMARY KEY,
    contest_id TEXT NOT NULL REFERENCES contests(id) ON DELETE CASCADE,
    participant_id VARCHAR(50) NOT NULL,
    account_id TEXT REFERENCES accounts(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    register_number VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    department VARCHAR(100) NOT NULL,
    year VARCHAR(50) NOT NULL,
    college TEXT,
    registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    start_time TEXT NOT NULL,
    end_time TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    score INT NOT NULL DEFAULT 0,
    solved_count INT NOT NULL DEFAULT 0,
    completion_time_seconds INT NOT NULL DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX idx_cp_cid ON contest_participants(contest_id);
CREATE INDEX idx_cp_pid ON contest_participants(participant_id);
CREATE INDEX idx_cp_score ON contest_participants(contest_id, score DESC, completion_time_seconds ASC);

-- 10. SUBMISSIONS TABLE
CREATE TABLE submissions (
    id TEXT PRIMARY KEY,
    contest_id TEXT NOT NULL REFERENCES contests(id) ON DELETE CASCADE,
    participant_id VARCHAR(50) NOT NULL,
    participant_name TEXT NOT NULL,
    question_id TEXT NOT NULL,
    question_title TEXT NOT NULL,
    language VARCHAR(50) NOT NULL,
    code TEXT NOT NULL,
    tests_passed INT NOT NULL DEFAULT 0,
    total_tests INT NOT NULL DEFAULT 0,
    score INT NOT NULL DEFAULT 0,
    status VARCHAR(50) NOT NULL,
    execution_time_ms INT NOT NULL DEFAULT 0,
    compiler_output TEXT,
    test_results JSONB DEFAULT '[]'::jsonb,
    submitted_at TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX idx_sub_cid ON submissions(contest_id);
CREATE INDEX idx_sub_pid ON submissions(participant_id);
CREATE INDEX idx_sub_qid ON submissions(question_id);

-- ==============================================================================
-- SEED DATA: CONTESTS
-- ==============================================================================

INSERT INTO contests (id, title, tagline, description, rules, organization, designed_by, status, duration_minutes, total_marks, total_questions, is_public, allow_registration)
VALUES 
('breach-the-bug-round-2', 'Breach the Bug — Round 2', 'Aegis Technical Coding Round 2', 
 'Solve algorithmic debugging and optimization challenges across Python, C, Java, and C++ with real-time automated testcase evaluation and anti-cheat tracking.',
 '["Do not refresh or switch tabs during active contest session.", "Submissions are evaluated against hidden test cases instantly.", "Rankings prioritize highest aggregate marks, then lowest total completion time."]'::jsonb,
 'Designers Domain Club', 'Aegis', 'active', 45, 50, 5, true, true),

('breach-the-bug-round-3', 'Breach the Bug — Round 3 (Grand Finale)', 'Aegis Technical Coding Grand Finale', 
 'Advanced algorithmic optimization, dynamic programming, and binary tree challenges for qualified finalists.',
 '["All code submissions are final.", "Memory and execution limits strictly enforced (2500ms max).", "Strict zero-tolerance on unauthorized external tools."]'::jsonb,
 'Designers Domain Club', 'Aegis', 'active', 60, 50, 4, true, true)
ON CONFLICT (id) DO NOTHING;

-- ==============================================================================
-- SEED DATA: QUESTION BANK (All 13 Comprehensive Challenges)
-- ==============================================================================

-- Q1: Palindrome Number Validator (Python)
INSERT INTO questions (id, title, slug, category, difficulty, tags, description, problem_statement, input_format, output_format, constraints, language, starter_code, marks, time_limit_ms)
VALUES (
  'btb2-q1', 'Palindrome Number & Negative Validator', 'palindrome-number-validator', 'Math & Strings', 'Easy',
  '["Math", "Strings", "Debugging", "Python"]'::jsonb,
  'Determine if an integer is a palindrome, properly handling negative numbers and edge cases.',
  'Given an integer `n`, determine whether `n` is a palindrome integer.\n\nAn integer is a palindrome when it reads the same forward and backward.\n\n**Rules:**\n- Negative integers are **never** palindromes because the negative sign does not match from right to left.\n- Print `true` if `n` is a palindrome, or `false` otherwise.',
  'Line 1: An integer `n`.',
  'Print `true` or `false` in lowercase.',
  '-2^31 <= n <= 2^31 - 1',
  'python',
  'import sys\n\ndef is_palindrome(n: int) -> bool:\n    # INTENTIONAL BUG: Converts directly to string without checking for negative sign\n    s = str(n)\n    return s == s[::-1]\n\ndef main():\n    raw = sys.stdin.read().strip()\n    if not raw:\n        return\n    n = int(raw)\n    result = is_palindrome(n)\n    print("true" if result else "false")\n\nif __name__ == "__main__":\n    main()\n',
  10, 2000
) ON CONFLICT (id) DO NOTHING;

-- Q2: Array Right Rotation (C)
INSERT INTO questions (id, title, slug, category, difficulty, tags, description, problem_statement, input_format, output_format, constraints, language, starter_code, marks, time_limit_ms)
VALUES (
  'btb2-q2', 'Array Right Rotation by K Steps', 'array-right-rotation', 'Arrays & Memory', 'Easy',
  '["Arrays", "C", "GCC", "Debugging"]'::jsonb,
  'Rotate an array of n integers to the right by k steps in-place or with minimal memory.',
  'Given an array of `n` integers, rotate the array to the right by `k` steps, where `k` is non-negative.\n\n**Input:**\nLine 1: Two integers `n` and `k`.\nLine 2: `n` space-separated integers.\n\n**Output:**\nPrint the rotated array elements separated by single spaces.',
  'Line 1: Two integers `n` and `k`.\nLine 2: `n` space-separated integers.',
  'Print the rotated array elements separated by spaces.',
  '1 <= n <= 10^5\n0 <= k <= 10^9\n-10^5 <= arr[i] <= 10^5',
  'c',
  '#include <stdio.h>\n#include <stdlib.h>\n\nvoid reverse(int arr[], int start, int end) {\n    while (start < end) {\n        int temp = arr[start];\n        arr[start] = arr[end];\n        arr[end] = temp;\n        start++;\n        end--;\n    }\n}\n\nvoid rotate_array(int arr[], int n, int k) {\n    // INTENTIONAL BUG: Does not modulo k with n\n    reverse(arr, 0, n - 1);\n    reverse(arr, 0, k);\n    reverse(arr, k, n - 1);\n}\n\nint main() {\n    int n, k;\n    if (scanf("%d %d", &n, &k) != 2 || n <= 0) return 0;\n    int* arr = (int*)malloc(n * sizeof(int));\n    for (int i = 0; i < n; i++) scanf("%d", &arr[i]);\n    rotate_array(arr, n, k);\n    for (int i = 0; i < n; i++) printf("%d%s", arr[i], (i == n - 1) ? "" : " ");\n    printf("\\n");\n    free(arr);\n    return 0;\n}\n',
  10, 2000
) ON CONFLICT (id) DO NOTHING;

-- Q3: Balanced Parentheses with Stack (Java)
INSERT INTO questions (id, title, slug, category, difficulty, tags, description, problem_statement, input_format, output_format, constraints, language, starter_code, marks, time_limit_ms)
VALUES (
  'btb2-q3', 'Balanced Bracket Sequences', 'balanced-bracket-sequences', 'Data Structures', 'Medium',
  '["Stacks", "Java", "Strings"]'::jsonb,
  'Validate nested parentheses, square brackets, and curly braces.',
  'Given a string containing `(`, `)`, `{`, `}`, `[` and `]`, determine if the input string is valid.\n\nOpen brackets must be closed by the same type of brackets in the correct order.\n\nPrint `YES` if valid, `NO` otherwise.',
  'Line 1: A string `s`.',
  'Print `YES` or `NO`.',
  '1 <= s.length <= 10^5',
  'java',
  'import java.util.*;\n\npublic class Solution {\n    public static boolean isValid(String s) {\n        Stack<Character> stack = new Stack<>();\n        for (char c : s.toCharArray()) {\n            if (c == \'(\' || c == \'{\' || c == \'[\') stack.push(c);\n            else {\n                if (stack.isEmpty()) return false;\n                char top = stack.pop();\n                if (c == \')\' && top != \'(\') return false;\n                if (c == \'}\' && top != \'{\') return false;\n                if (c == \']\' && top != \'[\') return false;\n            }\n        }\n        return stack.isEmpty();\n    }\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        String s = sc.next();\n        System.out.println(isValid(s) ? "YES" : "NO");\n    }\n}\n',
  10, 2500
) ON CONFLICT (id) DO NOTHING;

-- Q4: Two Sum Indices (C++)
INSERT INTO questions (id, title, slug, category, difficulty, tags, description, problem_statement, input_format, output_format, constraints, language, starter_code, marks, time_limit_ms)
VALUES (
  'btb2-q4', 'Two Sum Target Search', 'two-sum-target-search', 'Hash Maps & Arrays', 'Medium',
  '["Hash Table", "C++", "Vectors"]'::jsonb,
  'Find 0-indexed positions of two numbers in an array that add up to target.',
  'Given an array of integers `nums` and an integer `target`, return the 0-based indices of the two numbers such that they add up to `target`.\n\nPrint the two indices separated by a single space in increasing order.',
  'Line 1: Two integers `n` and `target`.\nLine 2: `n` space-separated integers.',
  'Print the two indices in increasing order separated by space.',
  '2 <= n <= 10^5\n-10^9 <= nums[i] <= 10^9',
  'cpp',
  '#include <iostream>\n#include <vector>\n#include <unordered_map>\nusing namespace std;\n\nint main() {\n    int n, target;\n    if (!(cin >> n >> target)) return 0;\n    vector<int> nums(n);\n    unordered_map<int, int> seen;\n    for (int i = 0; i < n; i++) cin >> nums[i];\n    for (int i = 0; i < n; i++) {\n        int comp = target - nums[i];\n        if (seen.find(comp) != seen.end()) {\n            cout << seen[comp] << " " << i << "\\n";\n            return 0;\n        }\n        seen[nums[i]] = i;\n    }\n    cout << "-1 -1\\n";\n    return 0;\n}\n',
  10, 2000
) ON CONFLICT (id) DO NOTHING;

-- Q5: Longest Substring Without Repeating Characters (Python)
INSERT INTO questions (id, title, slug, category, difficulty, tags, description, problem_statement, input_format, output_format, constraints, language, starter_code, marks, time_limit_ms)
VALUES (
  'btb2-q5', 'Longest Substring Without Repeating Characters', 'longest-substring-without-repeating', 'Sliding Window', 'Medium',
  '["Sliding Window", "Python", "Strings"]'::jsonb,
  'Find the length of the longest substring without repeating characters.',
  'Given a string `s`, find the length of the longest substring without duplicate characters.\n\nPrint the maximum length as an integer.',
  'Line 1: A string `s`.',
  'Print the length as an integer.',
  '0 <= s.length <= 10^5',
  'python',
  'import sys\n\ndef length_of_longest_substring(s: str) -> int:\n    char_index = {}\n    left = 0\n    max_len = 0\n    for right, c in enumerate(s):\n        if c in char_index and char_index[c] >= left:\n            left = char_index[c] + 1\n        char_index[c] = right\n        max_len = max(max_len, right - left + 1)\n    return max_len\n\ndef main():\n    raw = sys.stdin.read()\n    s = raw.rstrip("\\r\\n")\n    print(length_of_longest_substring(s))\n\nif __name__ == "__main__":\n    main()\n',
  10, 2000
) ON CONFLICT (id) DO NOTHING;

-- ==============================================================================
-- SEED DATA: TEST CASES (Samples & Hidden)
-- ==============================================================================

-- Q1 Testcases
INSERT INTO test_cases (id, question_id, input, expected_output, is_sample, marks, explanation, order_index)
VALUES 
('btb2-q1-s1', 'btb2-q1', '121', 'true', true, 0, '121 reads as 121 both ways.', 0),
('btb2-q1-s2', 'btb2-q1', '-121', 'false', true, 0, 'Negative numbers are not palindromes.', 1),
('btb2-q1-s3', 'btb2-q1', '10', 'false', true, 0, 'Reads 01 backwards.', 2),
('btb2-q1-h1', 'btb2-q1', '0', 'true', false, 3, 'Single zero is palindrome.', 3),
('btb2-q1-h2', 'btb2-q1', '12321', 'true', false, 3, 'Odd length symmetric palindrome.', 4),
('btb2-q1-h3', 'btb2-q1', '-101', 'false', false, 2, 'Negative sign fails.', 5),
('btb2-q1-h4', 'btb2-q1', '1000021', 'false', false, 2, 'Asymmetric.', 6)
ON CONFLICT (id) DO NOTHING;

-- Q2 Testcases
INSERT INTO test_cases (id, question_id, input, expected_output, is_sample, marks, explanation, order_index)
VALUES 
('btb2-q2-s1', 'btb2-q2', E'5 2\n1 2 3 4 5', '4 5 1 2 3', true, 0, 'Rotate 2 steps right.', 0),
('btb2-q2-s2', 'btb2-q2', E'4 5\n10 20 30 40', '40 10 20 30', true, 0, '5 % 4 = 1 step.', 1),
('btb2-q2-h1', 'btb2-q2', E'3 0\n1 2 3', '1 2 3', false, 3, '0 rotation is unchanged.', 2),
('btb2-q2-h2', 'btb2-q2', E'6 3\n7 8 9 1 2 3', '1 2 3 7 8 9', false, 3, 'Half rotation.', 3),
('btb2-q2-h3', 'btb2-q2', E'1 100\n42', '42', false, 2, 'Single element.', 4),
('btb2-q2-h4', 'btb2-q2', E'5 12\n1 2 3 4 5', '4 5 1 2 3', false, 2, 'k > n rotation test.', 5)
ON CONFLICT (id) DO NOTHING;

-- Q3 Testcases
INSERT INTO test_cases (id, question_id, input, expected_output, is_sample, marks, explanation, order_index)
VALUES 
('btb2-q3-s1', 'btb2-q3', '()[]{}', 'YES', true, 0, 'Standard pairs.', 0),
('btb2-q3-s2', 'btb2-q3', '(]', 'NO', true, 0, 'Mismatched types.', 1),
('btb2-q3-s3', 'btb2-q3', '([)]', 'NO', true, 0, 'Improper nesting.', 2),
('btb2-q3-h1', 'btb2-q3', '{[]}', 'YES', false, 3, 'Proper nested brackets.', 3),
('btb2-q3-h2', 'btb2-q3', '(((', 'NO', false, 3, 'Unclosed stack elements.', 4),
('btb2-q3-h3', 'btb2-q3', '))))', 'NO', false, 2, 'Empty stack pop error.', 5),
('btb2-q3-h4', 'btb2-q3', '{[()]}', 'YES', false, 2, 'Complex nested.', 6)
ON CONFLICT (id) DO NOTHING;

-- Q4 Testcases
INSERT INTO test_cases (id, question_id, input, expected_output, is_sample, marks, explanation, order_index)
VALUES 
('btb2-q4-s1', 'btb2-q4', E'4 9\n2 7 11 15', '0 1', true, 0, '2 + 7 = 9 at indices 0 and 1.', 0),
('btb2-q4-s2', 'btb2-q4', E'3 6\n3 2 4', '1 2', true, 0, '2 + 4 = 6 at indices 1 and 2.', 1),
('btb2-q4-h1', 'btb2-q4', E'2 6\n3 3', '0 1', false, 3, 'Duplicate values sum to target.', 2),
('btb2-q4-h2', 'btb2-q4', E'5 0\n-3 4 3 90 2', '0 2', false, 3, 'Negative number cancellation.', 3),
('btb2-q4-h3', 'btb2-q4', E'4 100\n10 20 80 40', '1 2', false, 2, '20 + 80 = 100.', 4),
('btb2-q4-h4', 'btb2-q4', E'3 10\n1 2 3', '-1 -1', false, 2, 'No solution found.', 5)
ON CONFLICT (id) DO NOTHING;

-- Q5 Testcases
INSERT INTO test_cases (id, question_id, input, expected_output, is_sample, marks, explanation, order_index)
VALUES 
('btb2-q5-s1', 'btb2-q5', 'abcabcbb', '3', true, 0, 'abc length is 3.', 0),
('btb2-q5-s2', 'btb2-q5', 'bbbbb', '1', true, 0, 'b length is 1.', 1),
('btb2-q5-s3', 'btb2-q5', 'pwwkew', '3', true, 0, 'wke length is 3.', 2),
('btb2-q5-h1', 'btb2-q5', ' ', '1', false, 3, 'Single space character.', 3),
('btb2-q5-h2', 'btb2-q5', 'au', '2', false, 3, 'Two distinct chars.', 4),
('btb2-q5-h3', 'btb2-q5', 'dvdf', '3', false, 2, 'vdf length is 3.', 5),
('btb2-q5-h4', 'btb2-q5', 'tmmzuxt', '5', false, 2, 'mzuxt length is 5.', 6)
ON CONFLICT (id) DO NOTHING;

-- ==============================================================================
-- ASSOCIATE QUESTIONS TO CONTESTS
-- ==============================================================================
INSERT INTO contest_questions (contest_id, question_id, display_order, marks_override)
VALUES 
('breach-the-bug-round-2', 'btb2-q1', 1, 10),
('breach-the-bug-round-2', 'btb2-q2', 2, 10),
('breach-the-bug-round-2', 'btb2-q3', 3, 10),
('breach-the-bug-round-2', 'btb2-q4', 4, 10),
('breach-the-bug-round-2', 'btb2-q5', 5, 10)
ON CONFLICT DO NOTHING;

-- Done!
