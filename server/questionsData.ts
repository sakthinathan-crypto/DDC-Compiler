import { Contest, FullQuestion, Question } from '../src/types';

export const INITIAL_QUESTION_BANK: FullQuestion[] = [
  // =========================================================================
  // BREACH THE BUG — ROUND 2 (5 Challenges)
  // =========================================================================
  {
    id: 'btb2-q1',
    title: 'Palindrome Number & Negative Validator',
    slug: 'palindrome-number-validator',
    category: 'Math & Strings',
    difficulty: 'Easy',
    tags: ['Math', 'Strings', 'Debugging', 'Python'],
    description: 'Determine if an integer is a palindrome, properly handling negative numbers and edge cases.',
    problemStatement: `Given an integer \`n\`, determine whether \`n\` is a palindrome integer.

An integer is a palindrome when it reads the same forward and backward. 

**Rules:**
- Negative integers are **never** palindromes because the negative sign does not match from right to left (e.g., \`-121\` backwards is \`121-\`).
- Print \`true\` if \`n\` is a palindrome, or \`false\` otherwise.`,
    inputFormat: `Line 1: An integer \`n\`.`,
    outputFormat: `Print \`true\` or \`false\` in lowercase.`,
    constraints: `-2^31 <= n <= 2^31 - 1`,
    language: 'python',
    starterCode: `import sys

def is_palindrome(n: int) -> bool:
    # INTENTIONAL BUG: Converts directly to string without checking for negative sign,
    # and fails to handle negative numbers according to mathematical palindrome rules.
    s = str(n)
    return s == s[::-1]

def main():
    raw = sys.stdin.read().strip()
    if not raw:
        return
    n = int(raw)
    result = is_palindrome(n)
    print("true" if result else "false")

if __name__ == '__main__':
    main()
`,
    marks: 10,
    timeLimitMs: 2000,
    sampleTestCases: [
      {
        id: 'btb2-q1-s1',
        input: '121',
        expectedOutput: 'true',
        isSample: true,
        marks: 0,
        explanation: '121 reads as 121 from left to right and from right to left.',
      },
      {
        id: 'btb2-q1-s2',
        input: '-121',
        expectedOutput: 'false',
        isSample: true,
        marks: 0,
        explanation: 'From left to right it reads -121. From right to left it becomes 121-. Therefore it is not a palindrome.',
      },
      {
        id: 'btb2-q1-s3',
        input: '10',
        expectedOutput: 'false',
        isSample: true,
        marks: 0,
        explanation: 'Reads 01 from right to left. Therefore it is not a palindrome.',
      },
    ],
    hiddenTestCases: [
      {
        id: 'btb2-q1-h1',
        input: '0',
        expectedOutput: 'true',
        isSample: false,
        marks: 2.5,
      },
      {
        id: 'btb2-q1-h2',
        input: '12321',
        expectedOutput: 'true',
        isSample: false,
        marks: 2.5,
      },
      {
        id: 'btb2-q1-h3',
        input: '-101',
        expectedOutput: 'false',
        isSample: false,
        marks: 2.5,
      },
      {
        id: 'btb2-q1-h4',
        input: '1000021',
        expectedOutput: 'false',
        isSample: false,
        marks: 2.5,
      },
    ],
  },
  {
    id: 'btb2-q2',
    title: 'Array Right Rotation by K Steps',
    slug: 'array-right-rotation',
    category: 'Arrays & Memory',
    difficulty: 'Easy',
    tags: ['Arrays', 'C', 'GCC', 'Debugging'],
    description: 'Rotate an array of n integers to the right by k steps in-place or with minimal memory.',
    problemStatement: `Given an array of \`n\` integers, rotate the array to the right by \`k\` steps, where \`k\` is non-negative.

**Input:**
Line 1: Two integers \`n\` and \`k\` (number of elements and rotation steps).
Line 2: \`n\` space-separated integers.

**Output:**
Print the rotated array elements separated by single spaces.`,
    inputFormat: `Line 1: Two integers \`n\` and \`k\`.\nLine 2: \`n\` space-separated integers.`,
    outputFormat: `Print the rotated array elements separated by spaces.`,
    constraints: `1 <= n <= 10^5\n0 <= k <= 10^9\n-10^5 <= arr[i] <= 10^5`,
    language: 'c',
    starterCode: `#include <stdio.h>
#include <stdlib.h>

void reverse(int arr[], int start, int end) {
    while (start < end) {
        int temp = arr[start];
        arr[start] = arr[end];
        arr[end] = temp;
        start++;
        end--;
    }
}

void rotate_array(int arr[], int n, int k) {
    // INTENTIONAL BUG 1: Does not modulo k with n, causing out of bounds when k > n
    // INTENTIONAL BUG 2: Reverse index boundary off-by-one
    reverse(arr, 0, n - 1);
    reverse(arr, 0, k); // Bug: should be k - 1
    reverse(arr, k, n - 1);
}

int main() {
    int n, k;
    if (scanf("%d %d", &n, &k) != 2 || n <= 0) {
        return 0;
    }
    int* arr = (int*)malloc(n * sizeof(int));
    for (int i = 0; i < n; i++) {
        scanf("%d", &arr[i]);
    }

    rotate_array(arr, n, k);

    for (int i = 0; i < n; i++) {
        printf("%d%s", arr[i], (i == n - 1) ? "" : " ");
    }
    printf("\\n");
    free(arr);
    return 0;
}
`,
    marks: 10,
    timeLimitMs: 2000,
    sampleTestCases: [
      {
        id: 'btb2-q2-s1',
        input: '5 2\n1 2 3 4 5',
        expectedOutput: '4 5 1 2 3',
        isSample: true,
        marks: 0,
        explanation: 'Rotate 1 step right: [5, 1, 2, 3, 4]. Rotate 2 steps right: [4, 5, 1, 2, 3].',
      },
      {
        id: 'btb2-q2-s2',
        input: '4 5\n10 20 30 40',
        expectedOutput: '40 10 20 30',
        isSample: true,
        marks: 0,
        explanation: '5 steps rotation on 4 elements is equivalent to 5 % 4 = 1 step rotation.',
      },
    ],
    hiddenTestCases: [
      {
        id: 'btb2-q2-h1',
        input: '3 0\n1 2 3',
        expectedOutput: '1 2 3',
        isSample: false,
        marks: 2.5,
      },
      {
        id: 'btb2-q2-h2',
        input: '6 3\n7 8 9 1 2 3',
        expectedOutput: '1 2 3 7 8 9',
        isSample: false,
        marks: 2.5,
      },
      {
        id: 'btb2-q2-h3',
        input: '1 100\n42',
        expectedOutput: '42',
        isSample: false,
        marks: 2.5,
      },
      {
        id: 'btb2-q2-h4',
        input: '5 7\n-5 -2 0 3 9',
        expectedOutput: '3 9 -5 -2 0',
        isSample: false,
        marks: 2.5,
      },
    ],
  },
  {
    id: 'btb2-q3',
    title: 'Find All Anagram Occurrences',
    slug: 'find-all-anagram-occurrences',
    category: 'Strings & Sliding Window',
    difficulty: 'Medium',
    tags: ['Strings', 'Sliding Window', 'Python', 'Hashing'],
    description: 'Count total anagram occurrences of pattern p inside string s using sliding window.',
    problemStatement: `Given two strings \`s\` and \`p\`, return the count of all start indices of \`p\`'s anagrams in \`s\`.

An **anagram** is a word or phrase formed by rearranging the letters of a different word or phrase, typically using all the original letters exactly once.`,
    inputFormat: `Line 1: String \`s\`\nLine 2: String \`p\``,
    outputFormat: `Print a single integer representing the count of anagram occurrences.`,
    constraints: `1 <= s.length, p.length <= 3 * 10^4\ns and p consist of lowercase English letters.`,
    language: 'python',
    starterCode: `import sys

def count_anagrams(s: str, p: str) -> int:
    if len(s) < len(p):
        return 0

    p_count = {}
    for ch in p:
        p_count[ch] = p_count.get(ch, 0) + 1

    s_count = {}
    k = len(p)
    # Initialize first window
    for i in range(k):
        s_count[s[i]] = s_count.get(s[i], 0) + 1

    matches = 0
    if s_count == p_count:
        matches += 1

    # Slide the window
    for i in range(k, len(s)):
        # Add new character
        s_count[s[i]] = s_count.get(s[i], 0) + 1
        
        # INTENTIONAL BUG: Decrementing count without deleting zero keys
        # causes dict equality comparison (s_count == p_count) to fail!
        old_char = s[i - k]
        s_count[old_char] -= 1

        if s_count == p_count:
            matches += 1

    return matches

def main():
    lines = sys.stdin.read().splitlines()
    if len(lines) < 2:
        print(0)
        return
    s = lines[0].strip()
    p = lines[1].strip()
    print(count_anagrams(s, p))

if __name__ == '__main__':
    main()
`,
    marks: 10,
    timeLimitMs: 2000,
    sampleTestCases: [
      {
        id: 'btb2-q3-s1',
        input: 'cbaebabacd\nabc',
        expectedOutput: '2',
        isSample: true,
        marks: 0,
        explanation: 'Substring starting at index 0 is "cba", which is an anagram of "abc". Substring starting at index 6 is "bac", which is also an anagram of "abc". Total = 2.',
      },
      {
        id: 'btb2-q3-s2',
        input: 'abab\nab',
        expectedOutput: '3',
        isSample: true,
        marks: 0,
        explanation: 'Substrings at index 0 ("ab"), index 1 ("ba"), and index 2 ("ab") are anagrams of "ab". Total = 3.',
      },
    ],
    hiddenTestCases: [
      {
        id: 'btb2-q3-h1',
        input: 'hello\nworld',
        expectedOutput: '0',
        isSample: false,
        marks: 2.5,
      },
      {
        id: 'btb2-q3-h2',
        input: 'aaaaa\naa',
        expectedOutput: '4',
        isSample: false,
        marks: 2.5,
      },
      {
        id: 'btb2-q3-h3',
        input: 'a\na',
        expectedOutput: '1',
        isSample: false,
        marks: 2.5,
      },
      {
        id: 'btb2-q3-h4',
        input: 'ab\nabc',
        expectedOutput: '0',
        isSample: false,
        marks: 2.5,
      },
    ],
  },
  {
    id: 'btb2-q4',
    title: 'Matrix Transpose & Diagonal Intersection Sum',
    slug: 'matrix-transpose-diagonal-sum',
    category: 'Matrix & Geometry',
    difficulty: 'Medium',
    tags: ['Matrix', 'C', 'GCC', '2D Arrays'],
    description: 'Transpose an N x N matrix and compute the diagonal intersection sum.',
    problemStatement: `Given an \`N x N\` square matrix, perform two tasks:
1. Transpose the matrix (swap rows with columns) and print the resulting matrix.
2. On the final line, print \`Diagonal Sum: <sum>\` representing the sum of both diagonals of the transposed matrix (primary diagonal and anti-diagonal).
**Note:** If \`N\` is odd, count the center intersecting element only once.`,
    inputFormat: `Line 1: An integer \`N\` representing matrix dimensions.\nNext \`N\` lines: \`N\` space-separated integers per line.`,
    outputFormat: `Print the \`N\` rows of transposed matrix, followed by \`Diagonal Sum: <sum>\` on the next line.`,
    constraints: `1 <= N <= 100\n-1000 <= matrix[i][j] <= 1000`,
    language: 'c',
    starterCode: `#include <stdio.h>
#include <stdlib.h>

int main() {
    int n;
    if (scanf("%d", &n) != 1 || n <= 0) {
        return 0;
    }

    int mat[100][100];
    for (int i = 0; i < n; i++) {
        for (int j = 0; j < n; j++) {
            scanf("%d", &mat[i][j]);
        }
    }

    // INTENTIONAL BUG 1: Transposing with j starting from 0 swaps (i, j) then swaps back at (j, i)
    for (int i = 0; i < n; i++) {
        for (int j = 0; j < n; j++) {
            int temp = mat[i][j];
            mat[i][j] = mat[j][i];
            mat[j][i] = temp;
        }
    }

    // Print transposed matrix
    for (int i = 0; i < n; i++) {
        for (int j = 0; j < n; j++) {
            printf("%d%s", mat[i][j], (j == n - 1) ? "" : " ");
        }
        printf("\\n");
    }

    // INTENTIONAL BUG 2: Double counts the center element when n is odd
    int diag_sum = 0;
    for (int i = 0; i < n; i++) {
        diag_sum += mat[i][i];
        diag_sum += mat[i][n - 1 - i];
    }

    printf("Diagonal Sum: %d\\n", diag_sum);
    return 0;
}
`,
    marks: 10,
    timeLimitMs: 2000,
    sampleTestCases: [
      {
        id: 'btb2-q4-s1',
        input: '3\n1 2 3\n4 5 6\n7 8 9',
        expectedOutput: '1 4 7\n2 5 8\n3 6 9\nDiagonal Sum: 25',
        isSample: true,
        marks: 0,
        explanation: 'Transposed matrix diagonals are [1, 5, 9] and [7, 5, 3]. Sum = 1 + 5 + 9 + 7 + 3 = 25 (center 5 counted once).',
      },
      {
        id: 'btb2-q4-s2',
        input: '2\n1 2\n3 4',
        expectedOutput: '1 3\n2 4\nDiagonal Sum: 10',
        isSample: true,
        marks: 0,
        explanation: 'Transposed matrix: [[1, 3], [2, 4]]. Diagonals: [1, 4] and [3, 2]. Sum = 1 + 4 + 3 + 2 = 10.',
      },
    ],
    hiddenTestCases: [
      {
        id: 'btb2-q4-h1',
        input: '1\n5',
        expectedOutput: '5\nDiagonal Sum: 5',
        isSample: false,
        marks: 2.5,
      },
      {
        id: 'btb2-q4-h2',
        input: '3\n1 0 0\n0 1 0\n0 0 1',
        expectedOutput: '1 0 0\n0 1 0\n0 0 1\nDiagonal Sum: 3',
        isSample: false,
        marks: 2.5,
      },
      {
        id: 'btb2-q4-h3',
        input: '4\n1 2 3 4\n5 6 7 8\n9 10 11 12\n13 14 15 16',
        expectedOutput: '1 5 9 13\n2 6 10 14\n3 7 11 15\n4 8 12 16\nDiagonal Sum: 68',
        isSample: false,
        marks: 2.5,
      },
    ],
  },
  {
    id: 'btb2-q5',
    title: 'Valid Parentheses with Asterisk Wildcards',
    slug: 'valid-parentheses-wildcard',
    category: 'Stack & Greedy',
    difficulty: 'Medium',
    tags: ['Stack', 'Greedy', 'Python', 'Strings'],
    description: 'Validate bracket strings containing open, closed, and wildcard asterisk symbols.',
    problemStatement: `Given a string containing only three types of characters: \`'('\`, \`')'\`, and \`'*'\`, write a function to check whether the string is valid.

We define the validity of a string by these rules:
1. Any left parenthesis \`'('\` must have a corresponding right parenthesis \`')'\`.
2. Any right parenthesis \`')'\` must have a corresponding left parenthesis \`'('\`.
3. Left parenthesis \`'('\` must go before the corresponding right parenthesis \`')'\`.
4. \`'*'\` could be treated as a single right parenthesis \`')'\` or a single left parenthesis \`'('\` or an empty string \`""\`.
5. An empty string is also valid.

Print \`Valid\` if the string is valid, or \`Invalid\` otherwise.`,
    inputFormat: `Line 1: A string of parenthesis and asterisks.`,
    outputFormat: `Print \`Valid\` or \`Invalid\`.`,
    constraints: `1 <= s.length <= 100`,
    language: 'python',
    starterCode: `import sys

def check_valid_string(s: str) -> bool:
    # INTENTIONAL BUG: Uses a naive single counter which treats '*' rigidly,
    # failing on dynamic combinations where '*' needs to be flexible.
    balance = 0
    for c in s:
        if c == '(':
            balance += 1
        elif c == ')':
            balance -= 1
        elif c == '*':
            # Faulty greedy choice
            if balance > 0:
                balance -= 1
            else:
                balance += 1
        if balance < 0:
            return False
    return balance == 0

def main():
    s = sys.stdin.read().strip()
    if not s:
        print("Valid")
        return
    print("Valid" if check_valid_string(s) else "Invalid")

if __name__ == '__main__':
    main()
`,
    marks: 10,
    timeLimitMs: 2000,
    sampleTestCases: [
      {
        id: 'btb2-q5-s1',
        input: '()',
        expectedOutput: 'Valid',
        isSample: true,
        marks: 0,
        explanation: 'Simple balanced pair.',
      },
      {
        id: 'btb2-q5-s2',
        input: '(*)',
        expectedOutput: 'Valid',
        isSample: true,
        marks: 0,
        explanation: 'Asterisk can act as an empty string, leaving "()".',
      },
      {
        id: 'btb2-q5-s3',
        input: '(*))',
        expectedOutput: 'Valid',
        isSample: true,
        marks: 0,
        explanation: 'Asterisk acts as a left parenthesis "(", making "()())" balanced.',
      },
    ],
    hiddenTestCases: [
      {
        id: 'btb2-q5-h1',
        input: ')(',
        expectedOutput: 'Invalid',
        isSample: false,
        marks: 2.5,
      },
      {
        id: 'btb2-q5-h2',
        input: '(*()',
        expectedOutput: 'Valid',
        isSample: false,
        marks: 2.5,
      },
      {
        id: 'btb2-q5-h3',
        input: '*',
        expectedOutput: 'Valid',
        isSample: false,
        marks: 2.5,
      },
      {
        id: 'btb2-q5-h4',
        input: '(((***',
        expectedOutput: 'Valid',
        isSample: false,
        marks: 2.5,
      },
    ],
  },

  // =========================================================================
  // BREACH THE BUG — ROUND 3 (8 Grand Finale Challenges)
  // =========================================================================
  {
    id: 'btb3-q1',
    title: 'Longest Substring Without Repeating Characters',
    slug: 'longest-substring-without-repeating',
    category: 'Strings & Two Pointers',
    difficulty: 'Medium',
    tags: ['Strings', 'Sliding Window', 'Two Pointers', 'Python'],
    description: 'Find the length of the longest substring with unique characters.',
    problemStatement: `Given a string \`s\`, find the length of the **longest substring** without repeating characters.`,
    inputFormat: `Line 1: A string \`s\`.`,
    outputFormat: `Print an integer representing the maximum substring length.`,
    constraints: `0 <= s.length <= 5 * 10^4\ns consists of English letters, digits, symbols and spaces.`,
    language: 'python',
    starterCode: `import sys

def length_of_longest_substring(s: str) -> int:
    char_map = {}
    max_len = 0
    left = 0

    for right in range(len(s)):
        char = s[right]
        # INTENTIONAL BUG: When char is found in char_map, setting left = char_map[char] + 1
        # without checking max(left, char_map[char] + 1) causes left pointer to jump backwards
        # to an already discarded character index outside the current window!
        if char in char_map:
            left = char_map[char] + 1
            
        char_map[char] = right
        max_len = max(max_len, right - left + 1)

    return max_len

def main():
    s = sys.stdin.read()
    # Strip only trailing newline if present, preserving spaces
    if s.endswith('\\n'):
        s = s[:-1]
    if not s:
        print(0)
        return
    print(length_of_longest_substring(s))

if __name__ == '__main__':
    main()
`,
    marks: 10,
    timeLimitMs: 2000,
    sampleTestCases: [
      {
        id: 'btb3-q1-s1',
        input: 'abcabcbb',
        expectedOutput: '3',
        isSample: true,
        marks: 0,
        explanation: 'The answer is "abc", with the length of 3.',
      },
      {
        id: 'btb3-q1-s2',
        input: 'bbbbb',
        expectedOutput: '1',
        isSample: true,
        marks: 0,
        explanation: 'The answer is "b", with the length of 1.',
      },
      {
        id: 'btb3-q1-s3',
        input: 'pwwkew',
        expectedOutput: '3',
        isSample: true,
        marks: 0,
        explanation: 'The answer is "wke", with the length of 3.',
      },
    ],
    hiddenTestCases: [
      {
        id: 'btb3-q1-h1',
        input: 'abba',
        expectedOutput: '2',
        isSample: false,
        marks: 2.5,
      },
      {
        id: 'btb3-q1-h2',
        input: 'tmmzuxt',
        expectedOutput: '5',
        isSample: false,
        marks: 2.5,
      },
      {
        id: 'btb3-q1-h3',
        input: 'abcdefghijklmnopqrstuvwxyz',
        expectedOutput: '26',
        isSample: false,
        marks: 2.5,
      },
      {
        id: 'btb3-q1-h4',
        input: 'dvdf',
        expectedOutput: '3',
        isSample: false,
        marks: 2.5,
      },
    ],
  },
  {
    id: 'btb3-q2',
    title: 'Search in Rotated Sorted Array',
    slug: 'search-in-rotated-sorted-array',
    category: 'Binary Search & Algorithms',
    difficulty: 'Medium',
    tags: ['Binary Search', 'Arrays', 'C', 'GCC'],
    description: 'Find the index of a target value in a rotated sorted array in O(log n) time.',
    problemStatement: `Given an integer array \`nums\` sorted in ascending order (with distinct values) that has been rotated at an unknown pivot, and an integer \`target\`, return the index of \`target\` if it is in \`nums\`, or \`-1\` if it is not in \`nums\`.`,
    inputFormat: `Line 1: Two integers \`n\` and \`target\`.\nLine 2: \`n\` space-separated integers.`,
    outputFormat: `Print the 0-based index of target or -1.`,
    constraints: `1 <= nums.length <= 10^5\n-10^4 <= nums[i], target <= 10^4\nAll values of nums are unique.`,
    language: 'c',
    starterCode: `#include <stdio.h>
#include <stdlib.h>

int search(int nums[], int n, int target) {
    int left = 0, right = n - 1;

    while (left <= right) {
        int mid = left + (right - left) / 2;

        if (nums[mid] == target) {
            return mid;
        }

        // Check if left half is sorted
        if (nums[left] <= nums[mid]) {
            // INTENTIONAL BUG: Missing boundary equality and wrong branch update
            if (nums[left] < target && target < nums[mid]) {
                right = mid - 1;
            } else {
                left = mid + 1;
            }
        } else {
            // Right half is sorted
            // INTENTIONAL BUG: Inverted inequality check
            if (nums[mid] < target && target <= nums[right]) {
                left = mid + 1;
            } else {
                right = mid - 1;
            }
        }
    }
    return -1;
}

int main() {
    int n, target;
    if (scanf("%d %d", &n, &target) != 2 || n <= 0) {
        printf("-1\\n");
        return 0;
    }

    int* nums = (int*)malloc(n * sizeof(int));
    for (int i = 0; i < n; i++) {
        scanf("%d", &nums[i]);
    }

    int result = search(nums, n, target);
    printf("%d\\n", result);

    free(nums);
    return 0;
}
`,
    marks: 10,
    timeLimitMs: 2000,
    sampleTestCases: [
      {
        id: 'btb3-q2-s1',
        input: '7 0\n4 5 6 7 0 1 2',
        expectedOutput: '4',
        isSample: true,
        marks: 0,
        explanation: 'Element 0 is located at index 4.',
      },
      {
        id: 'btb3-q2-s2',
        input: '7 3\n4 5 6 7 0 1 2',
        expectedOutput: '-1',
        isSample: true,
        marks: 0,
        explanation: 'Element 3 is not in the array.',
      },
    ],
    hiddenTestCases: [
      {
        id: 'btb3-q2-h1',
        input: '1 0\n0',
        expectedOutput: '0',
        isSample: false,
        marks: 2.5,
      },
      {
        id: 'btb3-q2-h2',
        input: '3 1\n5 1 3',
        expectedOutput: '1',
        isSample: false,
        marks: 2.5,
      },
      {
        id: 'btb3-q2-h3',
        input: '5 1\n1 2 3 4 5',
        expectedOutput: '0',
        isSample: false,
        marks: 2.5,
      },
      {
        id: 'btb3-q2-h4',
        input: '6 8\n4 5 6 7 8 1',
        expectedOutput: '4',
        isSample: false,
        marks: 2.5,
      },
    ],
  },
  {
    id: 'btb3-q3',
    title: 'Merge Overlapping Intervals',
    slug: 'merge-overlapping-intervals',
    category: 'Sorting & Intervals',
    difficulty: 'Medium',
    tags: ['Sorting', 'Intervals', 'Python'],
    description: 'Merge all overlapping interval pairs into non-overlapping contiguous intervals.',
    problemStatement: `Given an array of \`intervals\` where \`intervals[i] = [start_i, end_i]\`, merge all overlapping intervals, and return an array of the non-overlapping intervals that cover all the intervals in the input.

**Output:** Print each merged interval \`start end\` on a new line, sorted by start time.`,
    inputFormat: `Line 1: An integer \`n\` representing interval count.\nNext \`n\` lines: Two integers \`start end\` per line.`,
    outputFormat: `Print merged intervals, one per line.`,
    constraints: `1 <= intervals.length <= 10^4\n0 <= start_i <= end_i <= 10^4`,
    language: 'python',
    starterCode: `import sys

def merge_intervals(intervals):
    if not intervals:
        return []

    # INTENTIONAL BUG 1: Fails to sort intervals by start time first!
    # INTENTIONAL BUG 2: In merge step, directly sets end = current[1]
    # instead of max(previous_end, current[1])
    merged = [intervals[0]]

    for current in intervals[1:]:
        prev = merged[-1]
        if current[0] <= prev[1]:
            # Bug: Does not use max()
            prev[1] = current[1]
        else:
            merged.append(current)

    return merged

def main():
    lines = sys.stdin.read().splitlines()
    if not lines:
        return
    n = int(lines[0].strip())
    intervals = []
    for i in range(1, n + 1):
        parts = [int(x) for x in lines[i].split()]
        intervals.append(parts)

    res = merge_intervals(intervals)
    for interval in res:
        print(f"{interval[0]} {interval[1]}")

if __name__ == '__main__':
    main()
`,
    marks: 10,
    timeLimitMs: 2000,
    sampleTestCases: [
      {
        id: 'btb3-q3-s1',
        input: '4\n1 3\n2 6\n8 10\n15 18',
        expectedOutput: '1 6\n8 10\n15 18',
        isSample: true,
        marks: 0,
        explanation: 'Intervals [1, 3] and [2, 6] overlap, merging into [1, 6].',
      },
      {
        id: 'btb3-q3-s2',
        input: '2\n1 4\n4 5',
        expectedOutput: '1 5',
        isSample: true,
        marks: 0,
        explanation: 'Intervals [1, 4] and [4, 5] overlap at boundary 4, merging into [1, 5].',
      },
    ],
    hiddenTestCases: [
      {
        id: 'btb3-q3-h1',
        input: '2\n1 4\n2 3',
        expectedOutput: '1 4',
        isSample: false,
        marks: 2.5,
      },
      {
        id: 'btb3-q3-h2',
        input: '3\n5 8\n1 3\n2 6',
        expectedOutput: '1 8',
        isSample: false,
        marks: 2.5,
      },
      {
        id: 'btb3-q3-h3',
        input: '1\n3 7',
        expectedOutput: '3 7',
        isSample: false,
        marks: 2.5,
      },
      {
        id: 'btb3-q3-h4',
        input: '4\n1 10\n2 3\n4 5\n6 7',
        expectedOutput: '1 10',
        isSample: false,
        marks: 2.5,
      },
    ],
  },
  {
    id: 'btb3-q4',
    title: 'Maximum Circular Subarray Sum',
    slug: 'max-circular-subarray-sum',
    category: 'Dynamic Programming & Kadane',
    difficulty: 'Hard',
    tags: ['Kadane', 'DP', 'C', 'GCC', 'Arrays'],
    description: 'Find the maximum possible sum of a non-empty subarray in a circular integer array.',
    problemStatement: `Given a circular integer array \`nums\` of length \`n\`, return the maximum possible sum of a non-empty subarray of \`nums\`.

A **circular array** means the end of the array connects to the beginning of the array. Formally, the next element of \`nums[i]\` is \`nums[(i + 1) % n]\`.`,
    inputFormat: `Line 1: An integer \`n\`.\nLine 2: \`n\` space-separated integers.`,
    outputFormat: `Print the maximum circular subarray sum.`,
    constraints: `1 <= n <= 3 * 10^4\n-3 * 10^4 <= nums[i] <= 3 * 10^4`,
    language: 'c',
    starterCode: `#include <stdio.h>
#include <stdlib.h>

int max(int a, int b) { return a > b ? a : b; }
int min(int a, int b) { return a < b ? a : b; }

int max_subarray_sum_circular(int nums[], int n) {
    int total_sum = 0;
    int cur_max = 0, max_sum = nums[0];
    int cur_min = 0, min_sum = nums[0];

    for (int i = 0; i < n; i++) {
        cur_max = max(nums[i], cur_max + nums[i]);
        max_sum = max(max_sum, cur_max);

        cur_min = min(nums[i], cur_min + nums[i]);
        min_sum = min(min_sum, cur_min);

        total_sum += nums[i];
    }

    // INTENTIONAL BUG: When all elements are negative, total_sum - min_sum == 0,
    // which wrongly returns 0 instead of the maximum single negative element (max_sum)!
    return max(max_sum, total_sum - min_sum);
}

int main() {
    int n;
    if (scanf("%d", &n) != 1 || n <= 0) {
        return 0;
    }
    int* nums = (int*)malloc(n * sizeof(int));
    for (int i = 0; i < n; i++) {
        scanf("%d", &nums[i]);
    }

    printf("%d\\n", max_subarray_sum_circular(nums, n));
    free(nums);
    return 0;
}
`,
    marks: 10,
    timeLimitMs: 2000,
    sampleTestCases: [
      {
        id: 'btb3-q4-s1',
        input: '4\n1 -2 3 -2',
        expectedOutput: '3',
        isSample: true,
        marks: 0,
        explanation: 'Subarray [3] has maximum sum 3.',
      },
      {
        id: 'btb3-q4-s2',
        input: '3\n5 -3 5',
        expectedOutput: '10',
        isSample: true,
        marks: 0,
        explanation: 'Subarray [5, 5] wrapping around has maximum sum 5 + 5 = 10.',
      },
      {
        id: 'btb3-q4-s3',
        input: '3\n-3 -2 -3',
        expectedOutput: '-2',
        isSample: true,
        marks: 0,
        explanation: 'Subarray [-2] has maximum sum -2.',
      },
    ],
    hiddenTestCases: [
      {
        id: 'btb3-q4-h1',
        input: '5\n3 -1 2 -1 4',
        expectedOutput: '8',
        isSample: false,
        marks: 2.5,
      },
      {
        id: 'btb3-q4-h2',
        input: '1\n-5',
        expectedOutput: '-5',
        isSample: false,
        marks: 2.5,
      },
      {
        id: 'btb3-q4-h3',
        input: '4\n-2 -3 -1 -5',
        expectedOutput: '-1',
        isSample: false,
        marks: 2.5,
      },
      {
        id: 'btb3-q4-h4',
        input: '6\n2 -1 3 -2 4 -1',
        expectedOutput: '6',
        isSample: false,
        marks: 2.5,
      },
    ],
  },
  {
    id: 'btb3-q5',
    title: 'Coin Change Minimum Count',
    slug: 'coin-change-minimum-count',
    category: 'Dynamic Programming',
    difficulty: 'Medium',
    tags: ['DP', 'Python', 'Optimization'],
    description: 'Find the minimum number of coins needed to make up a given amount.',
    problemStatement: `You are given an integer array \`coins\` representing coins of different denominations and an integer \`amount\` representing a total amount of money.

Return the fewest number of coins that you need to make up that amount. If that amount of money cannot be made up by any combination of the coins, return \`-1\`.

You may assume that you have an infinite number of each kind of coin.`,
    inputFormat: `Line 1: Two integers \`n\` (coin count) and \`amount\`.\nLine 2: \`n\` space-separated coin denominations.`,
    outputFormat: `Print the minimum coins needed, or -1.`,
    constraints: `1 <= coins.length <= 12\n1 <= coins[i] <= 2^31 - 1\n0 <= amount <= 10^4`,
    language: 'python',
    starterCode: `import sys

def coin_change(coins, amount):
    if amount == 0:
        return 0

    # INTENTIONAL BUG 1: Initializing DP array with 0 instead of infinity (amount + 1)
    # causes min() comparison to always lock onto 0!
    dp = [0] * (amount + 1)

    for i in range(1, amount + 1):
        for coin in coins:
            if i - coin >= 0:
                # INTENTIONAL BUG 2: Forgets to add +1 to coin count
                dp[i] = min(dp[i], dp[i - coin])

    return dp[amount] if dp[amount] != 0 else -1

def main():
    lines = sys.stdin.read().splitlines()
    if not lines:
        return
    parts = lines[0].split()
    n = int(parts[0])
    amount = int(parts[1])
    coins = [int(x) for x in lines[1].split()]

    print(coin_change(coins, amount))

if __name__ == '__main__':
    main()
`,
    marks: 10,
    timeLimitMs: 2000,
    sampleTestCases: [
      {
        id: 'btb3-q5-s1',
        input: '3 11\n1 2 5',
        expectedOutput: '3',
        isSample: true,
        marks: 0,
        explanation: '11 = 5 + 5 + 1 (3 coins)',
      },
      {
        id: 'btb3-q5-s2',
        input: '1 3\n2',
        expectedOutput: '-1',
        isSample: true,
        marks: 0,
        explanation: 'Amount 3 cannot be formed using only denomination 2.',
      },
      {
        id: 'btb3-q5-s3',
        input: '1 0\n1',
        expectedOutput: '0',
        isSample: true,
        marks: 0,
        explanation: 'Amount 0 requires 0 coins.',
      },
    ],
    hiddenTestCases: [
      {
        id: 'btb3-q5-h1',
        input: '3 6249\n186 419 83',
        expectedOutput: '20',
        isSample: false,
        marks: 2.5,
      },
      {
        id: 'btb3-q5-h2',
        input: '4 100\n25 10 5 1',
        expectedOutput: '4',
        isSample: false,
        marks: 2.5,
      },
      {
        id: 'btb3-q5-h3',
        input: '2 7\n2 4',
        expectedOutput: '-1',
        isSample: false,
        marks: 2.5,
      },
      {
        id: 'btb3-q5-h4',
        input: '3 30\n25 10 1',
        expectedOutput: '3',
        isSample: false,
        marks: 2.5,
      },
    ],
  },
  {
    id: 'btb3-q6',
    title: 'Cycle Detection & Length in Index-Graph',
    slug: 'cycle-detection-and-length',
    category: 'Graph & Pointers',
    difficulty: 'Medium',
    tags: ['Pointers', 'Graphs', 'C', 'GCC', 'Floyd Cycle'],
    description: 'Detect whether a pointer chain starting from node 0 forms a cycle and calculate cycle length.',
    problemStatement: `You are given a directed graph represented by an array \`next\` of size \`n\`, where node \`i\` points to node \`next[i]\`. A value of \`-1\` indicates a terminal dead-end with no outgoing edges.

Starting at node \`0\`, determine if the traversal eventually enters a directed cycle.
- If a cycle exists, print \`Cycle Length: <L>\` where \`L\` is the number of distinct nodes inside the cycle loop.
- If traversal reaches \`-1\` or out of bounds, print \`No Cycle\`.`,
    inputFormat: `Line 1: An integer \`n\`.\nLine 2: \`n\` space-separated integers representing \`next[i]\`.`,
    outputFormat: `Print \`Cycle Length: <L>\` or \`No Cycle\`.`,
    constraints: `1 <= n <= 10^5\n-1 <= next[i] < n`,
    language: 'c',
    starterCode: `#include <stdio.h>
#include <stdlib.h>

void detect_cycle(int next[], int n) {
    int slow = 0;
    int fast = 0;

    // INTENTIONAL BUG 1: Fast pointer jumps two steps without verifying bounds on each step!
    while (fast != -1 && next[fast] != -1) {
        slow = next[slow];
        fast = next[next[fast]];

        if (slow == fast) {
            // Cycle detected - calculate length
            int length = 0;
            int current = slow;
            // INTENTIONAL BUG 2: Incorrect loop termination logic skips counting
            while (next[current] != slow) {
                length++;
                current = next[current];
            }
            printf("Cycle Length: %d\\n", length);
            return;
        }
    }

    printf("No Cycle\\n");
}

int main() {
    int n;
    if (scanf("%d", &n) != 1 || n <= 0) {
        printf("No Cycle\\n");
        return 0;
    }

    int* next = (int*)malloc(n * sizeof(int));
    for (int i = 0; i < n; i++) {
        scanf("%d", &next[i]);
    }

    detect_cycle(next, n);
    free(next);
    return 0;
}
`,
    marks: 10,
    timeLimitMs: 2000,
    sampleTestCases: [
      {
        id: 'btb3-q6-s1',
        input: '4\n1 2 3 1',
        expectedOutput: 'Cycle Length: 3',
        isSample: true,
        marks: 0,
        explanation: 'Path is 0 -> 1 -> 2 -> 3 -> 1. The cycle consists of nodes {1, 2, 3}, length = 3.',
      },
      {
        id: 'btb3-q6-s2',
        input: '3\n1 2 -1',
        expectedOutput: 'No Cycle',
        isSample: true,
        marks: 0,
        explanation: 'Path is 0 -> 1 -> 2 -> -1 (terminates).',
      },
    ],
    hiddenTestCases: [
      {
        id: 'btb3-q6-h1',
        input: '1\n0',
        expectedOutput: 'Cycle Length: 1',
        isSample: false,
        marks: 2.5,
      },
      {
        id: 'btb3-q6-h2',
        input: '5\n1 2 3 4 2',
        expectedOutput: 'Cycle Length: 3',
        isSample: false,
        marks: 2.5,
      },
      {
        id: 'btb3-q6-h3',
        input: '4\n1 -1 3 2',
        expectedOutput: 'No Cycle',
        isSample: false,
        marks: 2.5,
      },
      {
        id: 'btb3-q6-h4',
        input: '6\n1 2 3 4 5 0',
        expectedOutput: 'Cycle Length: 6',
        isSample: false,
        marks: 2.5,
      },
    ],
  },
  {
    id: 'btb3-q7',
    title: 'Trapping Rain Water',
    slug: 'trapping-rain-water',
    category: 'Two Pointers & Geometry',
    difficulty: 'Hard',
    tags: ['Two Pointers', 'Arrays', 'Python', 'Geometry'],
    description: 'Compute how much water an elevation map can trap after raining.',
    problemStatement: `Given \`n\` non-negative integers representing an elevation map where the width of each bar is \`1\`, compute how much water it can trap after raining.`,
    inputFormat: `Line 1: An integer \`n\`.\nLine 2: \`n\` space-separated non-negative integers.`,
    outputFormat: `Print a single integer representing trapped water volume.`,
    constraints: `1 <= n <= 2 * 10^4\n0 <= height[i] <= 10^5`,
    language: 'python',
    starterCode: `import sys

def trap_rain_water(height):
    if not height:
        return 0

    left, right = 0, len(height) - 1
    left_max, right_max = 0, 0
    water = 0

    while left < right:
        # INTENTIONAL BUG: Updates water calculation before updating left_max / right_max,
        # which adds wrong negative values or incorrect bounds!
        if height[left] < height[right]:
            water += left_max - height[left]
            left_max = max(left_max, height[left])
            left += 1
        else:
            water += right_max - height[right]
            right_max = max(right_max, height[right])
            right -= 1

    return max(0, water)

def main():
    lines = sys.stdin.read().splitlines()
    if not lines:
        return
    n = int(lines[0].strip())
    heights = [int(x) for x in lines[1].split()]
    print(trap_rain_water(heights))

if __name__ == '__main__':
    main()
`,
    marks: 10,
    timeLimitMs: 2000,
    sampleTestCases: [
      {
        id: 'btb3-q7-s1',
        input: '12\n0 1 0 2 1 0 1 3 2 1 2 1',
        expectedOutput: '6',
        isSample: true,
        marks: 0,
        explanation: 'Elevation map traps 6 units of rain water.',
      },
      {
        id: 'btb3-q7-s2',
        input: '6\n4 2 0 3 2 5',
        expectedOutput: '9',
        isSample: true,
        marks: 0,
        explanation: 'Traps 9 units of rain water between heights 4 and 5.',
      },
    ],
    hiddenTestCases: [
      {
        id: 'btb3-q7-h1',
        input: '3\n2 0 2',
        expectedOutput: '2',
        isSample: false,
        marks: 2.5,
      },
      {
        id: 'btb3-q7-h2',
        input: '4\n3 2 1 0',
        expectedOutput: '0',
        isSample: false,
        marks: 2.5,
      },
      {
        id: 'btb3-q7-h3',
        input: '1\n10',
        expectedOutput: '0',
        isSample: false,
        marks: 2.5,
      },
      {
        id: 'btb3-q7-h4',
        input: '7\n5 4 1 2 1 4 5',
        expectedOutput: '13',
        isSample: false,
        marks: 2.5,
      },
    ],
  },
  {
    id: 'btb3-q8',
    title: 'Sentence Word Reversal with Space Normalization',
    slug: 'sentence-word-reversal-space-normalization',
    category: 'Strings & Memory Management',
    difficulty: 'Hard',
    tags: ['Strings', 'C', 'GCC', 'Pointers', 'Memory'],
    description: 'Reverse the order of words in a sentence and normalize consecutive spaces.',
    problemStatement: `Given an input string \`s\`, reverse the order of the **words**.

A **word** is defined as a sequence of non-space characters. The words in \`s\` will be separated by at least one space.

Return a string of the words in reverse order concatenated by a single space.

**Note:**
- \`s\` may contain leading or trailing spaces or multiple spaces between two words.
- The returned string should only have a single space separating the words. Do not include any extra spaces.`,
    inputFormat: `Line 1: An input string with words and spaces.`,
    outputFormat: `Print the space-normalized reversed words string.`,
    constraints: `1 <= s.length <= 10^4\ns contains English letters (upper-case and lower-case), digits, and spaces ' '.`,
    language: 'c',
    starterCode: `#include <stdio.h>
#include <string.h>
#include <ctype.h>
#include <stdlib.h>

void reverse_range(char* s, int start, int end) {
    while (start < end) {
        char temp = s[start];
        s[start] = s[end];
        s[end] = temp;
        start++;
        end--;
    }
}

void reverse_words(char* s) {
    int len = strlen(s);
    // Reverse entire string
    reverse_range(s, 0, len - 1);

    // INTENTIONAL BUG: In-place word reversal fails to strip multiple consecutive spaces,
    // leading spaces, or trailing spaces, producing malformed output on irregular spaces!
    int start = 0;
    for (int i = 0; i <= len; i++) {
        if (s[i] == ' ' || s[i] == '\\0') {
            reverse_range(s, start, i - 1);
            start = i + 1;
        }
    }
}

int main() {
    char buffer[20000];
    if (!fgets(buffer, sizeof(buffer), stdin)) {
        return 0;
    }

    // Strip newline
    int len = strlen(buffer);
    if (len > 0 && buffer[len - 1] == '\\n') {
        buffer[len - 1] = '\\0';
    }

    reverse_words(buffer);
    printf("%s\\n", buffer);
    return 0;
}
`,
    marks: 10,
    timeLimitMs: 2000,
    sampleTestCases: [
      {
        id: 'btb3-q8-s1',
        input: 'the sky is blue',
        expectedOutput: 'blue is sky the',
        isSample: true,
        marks: 0,
        explanation: 'Words reversed in place: "blue is sky the".',
      },
      {
        id: 'btb3-q8-s2',
        input: '  hello world  ',
        expectedOutput: 'world hello',
        isSample: true,
        marks: 0,
        explanation: 'Reversed string should not contain leading or trailing spaces.',
      },
      {
        id: 'btb3-q8-s3',
        input: 'a good   example',
        expectedOutput: 'example good a',
        isSample: true,
        marks: 0,
        explanation: 'Multiple spaces between words are reduced to a single space.',
      },
    ],
    hiddenTestCases: [
      {
        id: 'btb3-q8-h1',
        input: 'single',
        expectedOutput: 'single',
        isSample: false,
        marks: 2.5,
      },
      {
        id: 'btb3-q8-h2',
        input: '  Bob    Loves  Alice   ',
        expectedOutput: 'Alice Loves Bob',
        isSample: false,
        marks: 2.5,
      },
      {
        id: 'btb3-q8-h3',
        input: 'Alice',
        expectedOutput: 'Alice',
        isSample: false,
        marks: 2.5,
      },
      {
        id: 'btb3-q8-h4',
        input: 'EPIC CODE BUGS RESOLVED',
        expectedOutput: 'RESOLVED BUGS CODE EPIC',
        isSample: false,
        marks: 2.5,
      },
    ],
  },
];

export const INITIAL_CONTESTS: Contest[] = [
  {
    id: 'breach-the-bug-round-2',
    title: 'Breach the Bug — Round 2',
    tagline: 'Intermediate Code & Logic Debugging Arena',
    description: 'Round 2 of the official Designers Domain Club debugging championship. Diagnose and resolve 5 debugging challenges in C and Python under strict timed conditions.',
    rules: [
      'Each participant gets an individual 45-minute countdown starting upon registration.',
      'The competition comprises 5 debugging challenges with starter code preloaded in C and Python.',
      'Test your solutions with sample test cases or custom inputs before submitting.',
      'Submissions are scored against strict hidden test cases evaluated server-side in isolated sandboxes.',
      'Ranking logic: Total Score (DESC), Solved Count (DESC), Completion Time (ASC).'
    ],
    organization: 'Designers Domain Club',
    designedBy: 'Aegis',
    status: 'active',
    durationMinutes: 45,
    isPublic: true,
    allowRegistration: true,
    questionIds: ['btb2-q1', 'btb2-q2', 'btb2-q3', 'btb2-q4', 'btb2-q5'],
    totalMarks: 50,
    totalQuestions: 5,
    createdAt: Date.now() - 3600 * 1000 * 24,
    updatedAt: Date.now(),
  },
  {
    id: 'breach-the-bug-round-3',
    title: 'Breach the Bug — Round 3',
    tagline: 'Grand Finale: Advanced Algorithmic & Systems Debugging',
    description: 'The decisive championship finale. Solve 8 advanced algorithmic and system debugging challenges in C and Python featuring pointer arithmetic, sliding windows, recursion, dynamic programming, and data structure invariants.',
    rules: [
      'Contest duration: 60 minutes individual countdown timer.',
      '8 advanced debugging challenges covering algorithms, pointer safety, dynamic programming, and data structures.',
      'Submissions are evaluated against comprehensive edge-case suites with partial scoring for test coverage.',
      'Ranking logic: Total Score (DESC), Solved Count (DESC), Completion Time (ASC).'
    ],
    organization: 'Designers Domain Club',
    designedBy: 'Aegis',
    status: 'active',
    durationMinutes: 60,
    isPublic: true,
    allowRegistration: true,
    questionIds: [
      'btb3-q1',
      'btb3-q2',
      'btb3-q3',
      'btb3-q4',
      'btb3-q5',
      'btb3-q6',
      'btb3-q7',
      'btb3-q8',
    ],
    totalMarks: 80,
    totalQuestions: 8,
    createdAt: Date.now() - 3600 * 1000 * 12,
    updatedAt: Date.now(),
  },
];
