import { INITIAL_QUESTION_BANK } from './server/questionsData';
import { executeSingle, compareOutputs } from './server/runner';

const solutions: Record<string, string> = {
  'btb2-q1': `import sys
def is_palindrome(n: int) -> bool:
    if n < 0:
        return False
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
  'btb2-q2': `#include <stdio.h>
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
    if (n <= 0) return;
    k = k % n;
    reverse(arr, 0, n - 1);
    reverse(arr, 0, k - 1);
    reverse(arr, k, n - 1);
}
int main() {
    int n, k;
    if (scanf("%d %d", &n, &k) != 2 || n <= 0) return 0;
    int* arr = (int*)malloc(n * sizeof(int));
    for (int i = 0; i < n; i++) scanf("%d", &arr[i]);
    rotate_array(arr, n, k);
    for (int i = 0; i < n; i++) printf("%d%s", arr[i], (i == n - 1) ? "" : " ");
    printf("\\n");
    free(arr);
    return 0;
}
`,
  'btb2-q3': `import sys
def count_anagrams(s: str, p: str) -> int:
    if len(s) < len(p):
        return 0
    p_count = {}
    for ch in p:
        p_count[ch] = p_count.get(ch, 0) + 1
    s_count = {}
    k = len(p)
    for i in range(k):
        s_count[s[i]] = s_count.get(s[i], 0) + 1
    matches = 0
    if s_count == p_count:
        matches += 1
    for i in range(k, len(s)):
        s_count[s[i]] = s_count.get(s[i], 0) + 1
        old_char = s[i - k]
        s_count[old_char] -= 1
        if s_count[old_char] == 0:
            del s_count[old_char]
        if s_count == p_count:
            matches += 1
    return matches
def main():
    lines = sys.stdin.read().splitlines()
    if len(lines) < 2:
        print(0)
        return
    print(count_anagrams(lines[0].strip(), lines[1].strip()))
if __name__ == '__main__':
    main()
`,
  'btb2-q4': `#include <stdio.h>
#include <stdlib.h>
int main() {
    int n;
    if (scanf("%d", &n) != 1 || n <= 0) return 0;
    int mat[100][100], trans[100][100];
    for (int i = 0; i < n; i++) {
        for (int j = 0; j < n; j++) {
            scanf("%d", &mat[i][j]);
            trans[j][i] = mat[i][j];
        }
    }
    for (int i = 0; i < n; i++) {
        for (int j = 0; j < n; j++) {
            printf("%d%s", trans[i][j], (j == n - 1) ? "" : " ");
        }
        printf("\\n");
    }
    int diag_sum = 0;
    for (int i = 0; i < n; i++) {
        diag_sum += trans[i][i];
        if (i != n - 1 - i) diag_sum += trans[i][n - 1 - i];
    }
    printf("Diagonal Sum: %d\\n", diag_sum);
    return 0;
}
`,
  'btb2-q5': `import sys
def check_valid_string(s: str) -> bool:
    cmin = 0
    cmax = 0
    for c in s:
        if c == '(':
            cmin += 1
            cmax += 1
        elif c == ')':
            cmin = max(0, cmin - 1)
            cmax -= 1
        elif c == '*':
            cmin = max(0, cmin - 1)
            cmax += 1
        if cmax < 0:
            return False
    return cmin == 0
def main():
    s = sys.stdin.read().strip()
    print("Valid" if check_valid_string(s) else "Invalid")
if __name__ == '__main__':
    main()
`,
  'btb3-q1': `import sys
def length_of_longest_substring(s: str) -> int:
    char_map = {}
    max_len = 0
    left = 0
    for right in range(len(s)):
        char = s[right]
        if char in char_map:
            left = max(left, char_map[char] + 1)
        char_map[char] = right
        max_len = max(max_len, right - left + 1)
    return max_len
def main():
    s = sys.stdin.read()
    if s.endswith('\\n'):
        s = s[:-1]
    if not s:
        print(0)
        return
    print(length_of_longest_substring(s))
if __name__ == '__main__':
    main()
`,
  'btb3-q2': `#include <stdio.h>
#include <stdlib.h>
int search(int nums[], int n, int target) {
    int left = 0, right = n - 1;
    while (left <= right) {
        int mid = left + (right - left) / 2;
        if (nums[mid] == target) return mid;
        if (nums[left] <= nums[mid]) {
            if (nums[left] <= target && target < nums[mid]) right = mid - 1;
            else left = mid + 1;
        } else {
            if (nums[mid] < target && target <= nums[right]) left = mid + 1;
            else right = mid - 1;
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
    for (int i = 0; i < n; i++) scanf("%d", &nums[i]);
    printf("%d\\n", search(nums, n, target));
    free(nums);
    return 0;
}
`,
  'btb3-q3': `import sys
def merge_intervals(intervals):
    if not intervals:
        return []
    intervals.sort(key=lambda x: x[0])
    merged = [intervals[0]]
    for current in intervals[1:]:
        prev = merged[-1]
        if current[0] <= prev[1]:
            prev[1] = max(prev[1], current[1])
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
        if i < len(lines):
            parts = [int(x) for x in lines[i].split()]
            intervals.append(parts)
    res = merge_intervals(intervals)
    for interval in res:
        print(f"{interval[0]} {interval[1]}")
if __name__ == '__main__':
    main()
`,
  'btb3-q4': `#include <stdio.h>
#include <stdlib.h>
int max_val(int a, int b) { return a > b ? a : b; }
int min_val(int a, int b) { return a < b ? a : b; }
int max_subarray_sum_circular(int nums[], int n) {
    int total_sum = 0;
    int cur_max = 0, max_sum = nums[0];
    int cur_min = 0, min_sum = nums[0];
    for (int i = 0; i < n; i++) {
        cur_max = max_val(cur_max + nums[i], nums[i]);
        max_sum = max_val(max_sum, cur_max);
        cur_min = min_val(cur_min + nums[i], nums[i]);
        min_sum = min_val(min_sum, cur_min);
        total_sum += nums[i];
    }
    if (max_sum < 0) return max_sum;
    return max_val(max_sum, total_sum - min_sum);
}
int main() {
    int n;
    if (scanf("%d", &n) != 1 || n <= 0) return 0;
    int* nums = (int*)malloc(n * sizeof(int));
    for (int i = 0; i < n; i++) scanf("%d", &nums[i]);
    printf("%d\\n", max_subarray_sum_circular(nums, n));
    free(nums);
    return 0;
}
`,
  'btb3-q5': `import sys
def min_coins(coins, amount):
    dp = [float('inf')] * (amount + 1)
    dp[0] = 0
    for coin in coins:
        for x in range(coin, amount + 1):
            dp[x] = min(dp[x], dp[x - coin] + 1)
    return dp[amount] if dp[amount] != float('inf') else -1
def main():
    lines = sys.stdin.read().splitlines()
    if len(lines) < 2:
        return
    n, amount = map(int, lines[0].split())
    coins = [int(x) for x in lines[1].split()]
    print(min_coins(coins, amount))
if __name__ == '__main__':
    main()
`,
  'btb3-q6': `#include <stdio.h>
#include <stdlib.h>
void detect_cycle(int next[], int n) {
    int slow = 0, fast = 0;
    while (fast >= 0 && fast < n && next[fast] >= 0 && next[fast] < n) {
        slow = next[slow];
        fast = next[next[fast]];
        if (slow == fast) {
            int length = 1;
            int current = next[slow];
            while (current != slow) {
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
    for (int i = 0; i < n; i++) scanf("%d", &next[i]);
    detect_cycle(next, n);
    free(next);
    return 0;
}
`,
  'btb3-q7': `import sys
def trap_rain_water(height):
    if not height:
        return 0
    left, right = 0, len(height) - 1
    left_max, right_max = 0, 0
    water = 0
    while left < right:
        if height[left] < height[right]:
            if height[left] >= left_max:
                left_max = height[left]
            else:
                water += left_max - height[left]
            left += 1
        else:
            if height[right] >= right_max:
                right_max = height[right]
            else:
                water += right_max - height[right]
            right -= 1
    return water
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
  'btb3-q8': `#include <stdio.h>
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
    int n = strlen(s);
    char* clean = (char*)malloc(n + 1);
    int idx = 0;
    int i = 0;
    while (i < n && s[i] == ' ') i++;
    while (i < n) {
        if (s[i] != ' ') {
            clean[idx++] = s[i++];
        } else {
            clean[idx++] = ' ';
            while (i < n && s[i] == ' ') i++;
        }
    }
    if (idx > 0 && clean[idx - 1] == ' ') idx--;
    clean[idx] = '\\0';
    reverse_range(clean, 0, idx - 1);
    int start = 0;
    for (int j = 0; j <= idx; j++) {
        if (clean[j] == ' ' || clean[j] == '\\0') {
            reverse_range(clean, start, j - 1);
            start = j + 1;
        }
    }
    strcpy(s, clean);
    free(clean);
}
int main() {
    char buffer[20000];
    if (!fgets(buffer, sizeof(buffer), stdin)) return 0;
    int len = strlen(buffer);
    if (len > 0 && buffer[len - 1] == '\\n') buffer[len - 1] = '\\0';
    reverse_words(buffer);
    printf("%s\\n", buffer);
    return 0;
}
`
};

async function testAll() {
  let totalTests = 0;
  let passedTests = 0;
  for (const q of INITIAL_QUESTION_BANK) {
    const sol = solutions[q.id];
    console.log(`=== Checking ${q.id} (${q.language}): ${q.title} ===`);
    if (!sol) {
      console.warn(`No solution provided for ${q.id}`);
      continue;
    }
    const allTests = [...(q.sampleTestCases || []), ...(q.hiddenTestCases || [])];
    for (let i = 0; i < allTests.length; i++) {
      totalTests++;
      const tc = allTests[i];
      const res = await executeSingle(q.language, sol, tc.input, 2000);
      const ok = compareOutputs(res.stdout, tc.expectedOutput);
      if (ok && res.status === 'Accepted') {
        passedTests++;
        console.log(`  Test ${i + 1} (${tc.isSample ? 'Sample' : 'Hidden'}): PASSED (${res.executionTimeMs}ms)`);
      } else {
        console.error(`  Test ${i + 1} (${tc.isSample ? 'Sample' : 'Hidden'}): FAILED!`);
        console.error(`     Status: ${res.status}`);
        console.error(`     Input: ${JSON.stringify(tc.input)}`);
        console.error(`     Expected: ${JSON.stringify(tc.expectedOutput)}`);
        console.error(`     Actual: ${JSON.stringify(res.stdout)}`);
        console.error(`     Stderr: ${JSON.stringify(res.stderr)}`);
      }
    }
  }
  console.log(`\nFINAL SCORE: ${passedTests} / ${totalTests} passed.`);
}

testAll();
