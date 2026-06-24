import Groq from 'groq-sdk';

export interface ProblemMetadata {
  problem: string;
  difficulty: string;
  topics: string[];
  confidence?: 'high' | 'low';
}

export interface TopicNotes {
  definition: string;
  intuition: string;
  when_to_use: string[];
  common_mistakes: string[];
  related_patterns: string[];
  confidence?: 'high' | 'low';
}

export interface SolutionAnalysis {
  problem: string;
  problem_understanding: string;
  examples_and_dry_run: string;
  pattern_recognition: string;
  brute_force: {
    intuition: string;
    thought_process: string;
    algorithm: string;
    code: string;
    complexity_time: string;
    complexity_space: string;
    tle_reason: string;
  };
  better_solution: {
    exists: boolean;
    explanation: string;
    code: string;
    complexity_time: string;
    complexity_space: string;
  };
  optimal_solution: {
    core_observation: string;
    why_it_works: string;
    explanation: string;
    code: string;
    line_by_line_explanation: string;
  };
  detailed_dry_run: string;
  complexity_analysis: {
    time_complexity: string;
    time_complexity_reason: string;
    space_complexity: string;
    space_complexity_reason: string;
    best_case?: string;
    average_case?: string;
    worst_case?: string;
  };
  interview_discussion: {
    why_asked: string;
    follow_ups: string[];
    common_mistakes: string[];
    edge_cases: string[];
    how_to_explain: string;
  };
  similar_problems: {
    easier: string[];
    similar: string[];
    harder: string[];
  };
  key_takeaways: {
    pattern: string;
    important_observation: string;
    complexity: string;
    interview_trick: string;
    common_pitfall: string;
  };
  alternative_approaches: string;
  edge_cases_checklist: Array<{
    case_name: string;
    matters: boolean;
    explanation: string;
  }>;
  reusable_template: string;
  confidence?: 'high' | 'low';
}

// Helper to get Groq client
function getGroqClient() {
  const currentKey = process.env.GROQ_API_KEY || '';
  if (!currentKey) return null;
  return new Groq({ apiKey: currentKey });
}

// Helper to clean and parse JSON response text safely
export function cleanAndParseJSON<T>(text: string): T {
  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
  }
  return JSON.parse(cleaned) as T;
}

/**
 * Step A: Problem Analysis (Rule 2)
 */
export async function analyzeProblemMetadata(
  title: string,
  difficulty: string,
  officialTopics: string[]
): Promise<ProblemMetadata> {
  const groq = getGroqClient();
  if (!groq) {
    return { problem: title, difficulty, topics: officialTopics };
  }

  try {
    const prompt = `You are a LeetCode metadata verification assistant. Given the following metadata:
- Problem Title: "${title}"
- Difficulty: "${difficulty}"
- Official Topics: ${JSON.stringify(officialTopics)}

Verify and output the canonical LeetCode metadata.
Rules:
1. Do NOT invent or hallucinate metadata.
2. Only use the provided problem details and known topics.
3. If you are uncertain or don't know the exact canonical topics, return {"confidence": "low"} instead of inventing information.

Return ONLY a valid JSON object matching this schema:
{
  "problem": "exact canonical problem title",
  "difficulty": "Easy" | "Medium" | "Hard",
  "topics": ["Canonical Topic 1", "Canonical Topic 2"],
  "confidence": "high" | "low"
}

Do not write any markdown code blocks or prose outside JSON. No LaTeX.`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.1,
      response_format: { type: 'json_object' }
    });

    const text = chatCompletion.choices[0]?.message?.content || '{}';
    const data = cleanAndParseJSON<any>(text);

    if (data.confidence === 'low' || !data.problem) {
      return { problem: title, difficulty, topics: officialTopics, confidence: 'low' };
    }

    return {
      problem: data.problem,
      difficulty: data.difficulty || difficulty,
      topics: data.topics || officialTopics,
      confidence: 'high'
    };
  } catch (error) {
    console.error('Groq Step A Metadata Analysis Error:', error);
    return { problem: title, difficulty, topics: officialTopics, confidence: 'low' };
  }
}

/**
 * Step B: Topic Note Generation (Rule 2)
 */
export async function generateTopicNotes(topic: string): Promise<TopicNotes> {
  const groq = getGroqClient();
  if (!groq) {
    return getLocalFallbackTopicNotes(topic);
  }

  try {
    const prompt = `You are an expert computer science educator. Generate structured notes for the topic: "${topic}".

Rules:
1. Stick strictly to the specified topic "${topic}". Do NOT introduce unrelated concepts.
2. Return ONLY a valid JSON object matching the schema below. No LaTeX formatting (like \\textbf, \\texttt, etc.). No markdown format. Return plain text values only.
3. If you are uncertain or lack factual knowledge about this topic, return {"confidence": "low"}.

Expected Schema:
{
  "definition": "Clear definition of the topic concept.",
  "intuition": "Visual intuition and core operational premise.",
  "when_to_use": [
    "Clue 1 indicating this pattern should be used",
    "Clue 2 indicating this pattern should be used"
  ],
  "common_mistakes": [
    "Mistake 1 commonly made by candidates",
    "Mistake 2 commonly made by candidates"
  ],
  "related_patterns": [
    "Related Pattern A",
    "Related Pattern B"
  ],
  "confidence": "high" | "low"
}

Do not write any markdown code blocks or prose outside JSON.`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.1,
      response_format: { type: 'json_object' }
    });

    const text = chatCompletion.choices[0]?.message?.content || '{}';
    const data = cleanAndParseJSON<any>(text);

    if (data.confidence === 'low' || !data.definition) {
      return getLocalFallbackTopicNotes(topic);
    }

    return {
      definition: data.definition,
      intuition: data.intuition,
      when_to_use: data.when_to_use || [],
      common_mistakes: data.common_mistakes || [],
      related_patterns: data.related_patterns || [],
      confidence: 'high'
    };
  } catch (error) {
    console.error('Groq Step B Topic Note Generation Error:', error);
    return getLocalFallbackTopicNotes(topic);
  }
}

/**
 * Step C: Solution Explanation (Rule 6)
 */
export async function generateSolutionAnalysis(
  problem: string,
  difficulty: string,
  topics: string[]
): Promise<SolutionAnalysis> {
  const groq = getGroqClient();
  if (!groq) {
    return getLocalFallbackSolution(problem);
  }

  try {
    const prompt = `You are a Senior Software Engineer at Google and an expert DSA instructor.
Your task is to explain the LeetCode problem "${problem}" (${difficulty}) in C++ as if teaching a student preparing for FAANG interviews.

For the given problem, generate a COMPLETE learning document matching the JSON structure below.
Rules:
1. Generate detailed, problem-focused explanations. Never skip intuition or jump directly to the optimal solution.
2. Return ONLY a single valid JSON object matching the schema below.
3. Do NOT include markdown code blocks or prose outside the JSON. No LaTeX commands (like \\textbf, \\texttt, etc.).
4. Escape all newlines (\\n) and double quotes (\\") inside JSON strings.

JSON Schema format:
{
  "problem": "${problem}",
  "problem_understanding": "Explain the problem in simple English, inputs/outputs, constraints, and hidden observations from constraints.",
  "examples_and_dry_run": "For every example, explain why the correct answer is correct. Trace the execution and provide ASCII-based diagrams or tables.",
  "pattern_recognition": "Identify which DSA pattern is used (e.g. Sliding Window, Two Pointers, Dynamic Programming, etc.), why it is appropriate, and common signals to look for.",
  "brute_force": {
    "intuition": "Brute force intuition",
    "thought_process": "Thought process",
    "algorithm": "Brief algorithm description",
    "code": "C++ code of the brute force solution",
    "complexity_time": "Time Complexity",
    "complexity_space": "Space Complexity",
    "tle_reason": "Why it might cause TLE"
  },
  "better_solution": {
    "exists": true or false (boolean),
    "explanation": "Better solution logic (or 'None' if optimal is next)",
    "code": "C++ code of better solution (if exists, or empty string)",
    "complexity_time": "Time complexity (if exists, or empty string)",
    "complexity_space": "Space complexity (if exists, or empty string)"
  },
  "optimal_solution": {
    "core_observation": "Core observation of the optimal solution",
    "why_it_works": "Why it works and mathematical reasoning",
    "explanation": "Detailed step-by-step intuition",
    "code": "Complete optimal C++ solution code",
    "line_by_line_explanation": "Line-by-line explanation of variables, loops, conditions, and edge cases"
  },
  "detailed_dry_run": "State of variables after every iteration, pointer movements, state changes in maps/sets/stacks/tables using text tables.",
  "complexity_analysis": {
    "time_complexity": "Time Complexity (e.g. O(N))",
    "time_complexity_reason": "Reason for time complexity",
    "space_complexity": "Space Complexity (e.g. O(1))",
    "space_complexity_reason": "Reason for space complexity",
    "best_case": "Best case complexity (if relevant, or empty string)",
    "average_case": "Average case complexity (if relevant, or empty string)",
    "worst_case": "Worst case complexity (if relevant, or empty string)"
  },
  "interview_discussion": {
    "why_asked": "Why interviewer asks this question",
    "follow_ups": ["Follow up 1?", "Follow up 2?"],
    "common_mistakes": ["Mistake 1", "Mistake 2"],
    "edge_cases": ["Edge case 1", "Edge case 2"],
    "how_to_explain": "How to explain this solution step-by-step during an interview"
  },
  "similar_problems": {
    "easier": ["Easier problem 1", "Easier problem 2"],
    "similar": ["Similar problem 1", "Similar problem 2"],
    "harder": ["Harder variation 1", "Harder variation 2"]
  },
  "key_takeaways": {
    "pattern": "Core pattern name",
    "important_observation": "Main observation",
    "complexity": "Time & Space complexity summary",
    "interview_trick": "Core trick",
    "common_pitfall": "Pitfall to avoid"
  },
  "alternative_approaches": "Explain alternative methods and why they are inferior/superior, including complexity comparison.",
  "edge_cases_checklist": [
    { "case_name": "Empty input", "matters": true, "explanation": "matters because..." },
    { "case_name": "Single element", "matters": true, "explanation": "matters because..." },
    { "case_name": "Duplicates", "matters": true, "explanation": "matters because..." },
    { "case_name": "Negative values", "matters": true, "explanation": "matters because..." },
    { "case_name": "Large constraints", "matters": true, "explanation": "matters because..." },
    { "case_name": "Overflow possibility", "matters": true, "explanation": "matters because..." },
    { "case_name": "Sorted input", "matters": true, "explanation": "matters because..." },
    { "case_name": "Unsorted input", "matters": true, "explanation": "matters because..." }
  ],
  "reusable_template": "A generic reusable C++ template for solving similar problems."
}

Ensure the content is detailed, pedagogically sound, and specifically tailored to "${problem}".`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.1,
      response_format: { type: 'json_object' }
    });

    const text = chatCompletion.choices[0]?.message?.content || '{}';
    const data = cleanAndParseJSON<any>(text);

    if (data.confidence === 'low' || !data.brute_force) {
      return getLocalFallbackSolution(problem);
    }

    return {
      problem: data.problem || problem,
      problem_understanding: data.problem_understanding || '',
      examples_and_dry_run: data.examples_and_dry_run || '',
      pattern_recognition: data.pattern_recognition || '',
      brute_force: {
        intuition: data.brute_force?.intuition || '',
        thought_process: data.brute_force?.thought_process || '',
        algorithm: data.brute_force?.algorithm || '',
        code: data.brute_force?.code || '',
        complexity_time: data.brute_force?.complexity_time || '',
        complexity_space: data.brute_force?.complexity_space || '',
        tle_reason: data.brute_force?.tle_reason || ''
      },
      better_solution: {
        exists: !!data.better_solution?.exists,
        explanation: data.better_solution?.explanation || '',
        code: data.better_solution?.code || '',
        complexity_time: data.better_solution?.complexity_time || '',
        complexity_space: data.better_solution?.complexity_space || ''
      },
      optimal_solution: {
        core_observation: data.optimal_solution?.core_observation || '',
        why_it_works: data.optimal_solution?.why_it_works || '',
        explanation: data.optimal_solution?.explanation || '',
        code: data.optimal_solution?.code || '',
        line_by_line_explanation: data.optimal_solution?.line_by_line_explanation || ''
      },
      detailed_dry_run: data.detailed_dry_run || '',
      complexity_analysis: {
        time_complexity: data.complexity_analysis?.time_complexity || '',
        time_complexity_reason: data.complexity_analysis?.time_complexity_reason || '',
        space_complexity: data.complexity_analysis?.space_complexity || '',
        space_complexity_reason: data.complexity_analysis?.space_complexity_reason || '',
        best_case: data.complexity_analysis?.best_case || '',
        average_case: data.complexity_analysis?.average_case || '',
        worst_case: data.complexity_analysis?.worst_case || ''
      },
      interview_discussion: {
        why_asked: data.interview_discussion?.why_asked || '',
        follow_ups: data.interview_discussion?.follow_ups || [],
        common_mistakes: data.interview_discussion?.common_mistakes || [],
        edge_cases: data.interview_discussion?.edge_cases || [],
        how_to_explain: data.interview_discussion?.how_to_explain || ''
      },
      similar_problems: {
        easier: data.similar_problems?.easier || [],
        similar: data.similar_problems?.similar || [],
        harder: data.similar_problems?.harder || []
      },
      key_takeaways: {
        pattern: data.key_takeaways?.pattern || '',
        important_observation: data.key_takeaways?.important_observation || '',
        complexity: data.key_takeaways?.complexity || '',
        interview_trick: data.key_takeaways?.interview_trick || '',
        common_pitfall: data.key_takeaways?.common_pitfall || ''
      },
      alternative_approaches: data.alternative_approaches || '',
      edge_cases_checklist: data.edge_cases_checklist || [],
      reusable_template: data.reusable_template || '',
      confidence: 'high'
    };
  } catch (error) {
    console.error('Groq Step C Solution Analysis Error:', error);
    return getLocalFallbackSolution(problem);
  }
}

// --- Local Fallback Handlers for offline, rate-limit, or low-confidence safety ---

function getLocalFallbackTopicNotes(topic: string): TopicNotes {
  const t = topic.toLowerCase();
  if (t.includes('prefix sum')) {
    return {
      definition: 'Prefix Sum computes cumulative sums of elements up to each index, allowing constant-time subarray range sum lookups.',
      intuition: 'By pre-computing prefix sums, any subarray sum can be calculated as the difference between two prefix values.',
      when_to_use: [
        'Finding ranges or contiguous subarray metrics.',
        'Frequent range sum queries needed.',
        'Negative numbers present, which invalidates Sliding Window.'
      ],
      common_mistakes: [
        'Off-by-one errors on boundary ranges.',
        'Forgetting to initialize base sum case (e.g., sum=0 index).'
      ],
      related_patterns: ['Hash Map Frequencies', 'Difference Array'],
      confidence: 'low'
    };
  } else if (t.includes('difference array')) {
    return {
      definition: 'A difference array D is an array where D[i] = A[i] - A[i-1], used to perform range updates in O(1) time.',
      intuition: 'Incrementing D[L] and decrementing D[R+1] shifts the entire range [L, R] when prefix sums are taken.',
      when_to_use: [
        'Frequent range addition or update operations are required.',
        'Queries are performed after all updates are finished.'
      ],
      common_mistakes: [
        'Forgetting to update the boundary index R+1.',
        'Out of bounds on R+1 at the end of the array.'
      ],
      related_patterns: ['Prefix Sum', 'Segment Tree'],
      confidence: 'low'
    };
  } else if (t.includes('sliding window')) {
    return {
      definition: 'Sliding Window maintains a sub-segment defined by two pointers, sliding across a sequence to find optimal subarrays.',
      intuition: 'Instead of recalculating every window from scratch, elements are added on the right and evicted on the left.',
      when_to_use: [
        'Finding contiguous subarrays matching target lengths/sums.',
        'Searching for longest or shortest valid sub-segments.'
      ],
      common_mistakes: [
        'Off-by-one pointer index offsets.',
        'Incorrect shrink triggers.'
      ],
      related_patterns: ['Two Pointers', 'Monotonic Queue'],
      confidence: 'low'
    };
  } else if (t.includes('array')) {
    return {
      definition: 'An array is a contiguous data structure storing elements of the same type in sequential memory addresses.',
      intuition: 'Enables O(1) random access by index. Best suited for static datasets or fixed size indices.',
      when_to_use: [
        'Direct index lookup is needed.',
        'Sequence processing with fixed boundaries.'
      ],
      common_mistakes: [
        'Out of bounds errors.',
        'Off-by-one boundary conditions.'
      ],
      related_patterns: ['Two Pointers', 'Sliding Window', 'Prefix Sum'],
      confidence: 'low'
    };
  }
  return {
    definition: `Detailed conceptual definitions of ${topic} algorithms.`,
    intuition: `Intuitive visualization of search spaces and indexes.`,
    when_to_use: [`Indicators pointing to ${topic} efficiency advantages.`],
    common_mistakes: [`Boundary check oversights and index offsets.`],
    related_patterns: [`Dynamic Programming`, `Recursion`],
    confidence: 'low'
  };
}

function getLocalFallbackSolution(problem: string): SolutionAnalysis {
  const p = problem.toLowerCase();
  if (p.includes('subarray sum')) {
    return {
      problem,
      problem_understanding: 'Given an array of integers nums and an integer k, return the total number of continuous subarrays whose sum equals to k. The input arrays can contain negative numbers and constraints are up to 2*10^4 elements.',
      examples_and_dry_run: 'Example: nums = [1,1,1], k = 2. Subarrays: [1,1] at index [0,1] and [1,1] at index [1,2] sum to 2. Total = 2.',
      pattern_recognition: 'Prefix Sum + Hashing. We use prefix sum because we need contiguous subarrays, and we use a hash map to look up previous prefix sums in O(1) time.',
      brute_force: {
        intuition: 'Compute the sum of every possible contiguous subarray and count how many sum to k.',
        thought_process: 'Use nested loops: outer loop select start index, inner loop select end index, sum elements.',
        algorithm: 'Iterate i from 0 to N. Iterate j from i to N. Sum nums[i..j]. If sum == k, increment count.',
        code: `int subarraySumBrute(vector<int>& nums, int k) {\n    int count = 0;\n    for (int i = 0; i < nums.size(); i++) {\n        int sum = 0;\n        for (int j = i; j < nums.size(); j++) {\n            sum += nums[j];\n            if (sum == k) count++;\n        }\n    }\n    return count;\n}`,
        complexity_time: 'O(N^2) where N is length of nums.',
        complexity_space: 'O(1) auxiliary space.',
        tle_reason: 'For N = 2 * 10^4, N^2 operations is 4 * 10^8 which exceeds typical 1-second C++ execution limits.'
      },
      better_solution: {
        exists: false,
        explanation: 'None',
        code: '',
        complexity_time: '',
        complexity_space: ''
      },
      optimal_solution: {
        core_observation: 'If cumulative sum up to index i is sum_i, and cumulative sum up to index j (where j < i) is sum_j, then the subarray sum_j..i equals k if sum_i - sum_j = k, which is equivalent to sum_j = sum_i - k.',
        why_it_works: 'By maintaining a running prefix sum, at each step we check if (prefix_sum - k) exists in our hash map of previously seen prefix sums.',
        explanation: 'Iterate through array, update running prefix sum, add frequency of (prefix_sum - k) to output count, and record current prefix sum in map.',
        code: `int subarraySum(vector<int>& nums, int k) {\n    unordered_map<int, int> mp = {{0, 1}};\n    int sum = 0, count = 0;\n    for(int x : nums) {\n        sum += x;\n        if(mp.count(sum - k)) count += mp[sum - k];\n        mp[sum]++;\n    }\n    return count;\n}`,
        line_by_line_explanation: 'mp stores frequency of prefix sums. sum holds the running cumulative sum. count counts valid subarrays. If sum-k was seen, it means some subarray sums to k. Increment count by that frequency. Finally, insert sum to mp.'
      },
      detailed_dry_run: 'Prefix sums recorded sequentially: i=0: sum=1, search sum-k=-1 (not found), mp={0:1, 1:1}. i=1: sum=2, search sum-k=0 (found, count+=1), mp={0:1, 1:1, 2:1}. i=2: sum=3, search sum-k=1 (found, count+=1), mp={0:1, 1:1, 2:1, 3:1}.',
      complexity_analysis: {
        time_complexity: 'O(N)',
        time_complexity_reason: 'We traverse the array of length N once. Each hash map insertion and search takes O(1) time on average.',
        space_complexity: 'O(N)',
        space_complexity_reason: 'In the worst case, all prefix sums are distinct, and we store N elements in the unordered_map.',
        best_case: 'O(N)',
        average_case: 'O(N)',
        worst_case: 'O(N)'
      },
      interview_discussion: {
        why_asked: 'Tests understanding of hashing optimizations and mathematical prefix sum reductions.',
        follow_ups: ['What if constraints only have positive numbers? (Can use sliding window for O(1) space).'],
        common_mistakes: ['Forgetting to initialize the hash map with {0: 1}.', 'Off-by-one indices.'],
        edge_cases: ['Negative values in input.', 'K equals 0.', 'All elements equal.'],
        how_to_explain: 'Start with brute force O(N^2), explain why we recalculate sums, introduce prefix sum reduction, and show how hashing brings lookup to O(1).'
      },
      similar_problems: {
        easier: ['Two Sum (LC 1)'],
        similar: ['Subarray Sums Divisible by K (LC 974)'],
        harder: ['Count of Range Sum (LC 327)']
      },
      key_takeaways: {
        pattern: 'Prefix Sum + Hash Map',
        important_observation: 'sum[i..j] = sum[0..j] - sum[0..i-1]',
        complexity: 'Time: O(N) | Space: O(N)',
        interview_trick: 'Initialize map with {0:1} to handle exact matches.',
        common_pitfall: 'Do not use sliding window if negative numbers exist.'
      },
      alternative_approaches: 'If all numbers are positive, we can use two-pointer sliding window which reduces space complexity to O(1).',
      edge_cases_checklist: [
        { case_name: 'Empty input', matters: true, explanation: 'Returns 0.' },
        { case_name: 'Single element', matters: true, explanation: 'Simple base match.' },
        { case_name: 'Duplicates', matters: true, explanation: 'Increases counts in map.' },
        { case_name: 'Negative values', matters: true, explanation: 'Forces prefix sum instead of sliding window.' },
        { case_name: 'Large constraints', matters: true, explanation: 'Invalidates brute force.' },
        { case_name: 'Overflow possibility', matters: false, explanation: 'Not possible within integer bounds.' },
        { case_name: 'Sorted input', matters: false, explanation: 'No impact.' },
        { case_name: 'Unsorted input', matters: false, explanation: 'Normal behavior.' }
      ],
      reusable_template: `// Reusable Prefix Sum + Map Template\nint solve(vector<int>& nums, int target) {\n    unordered_map<int, int> mp = {{0, 1}};\n    int sum = 0, count = 0;\n    for(int x : nums) {\n        sum += x;\n        if(mp.count(sum - target)) count += mp[sum - target];\n        mp[sum]++;\n    }\n    return count;\n}`,
      confidence: 'low'
    };
  }
  return {
    problem,
    problem_understanding: 'Analyze problem constraints and requirements.',
    examples_and_dry_run: 'Examine example input and output.',
    pattern_recognition: 'Determine DSA pattern.',
    brute_force: {
      intuition: 'Naive implementation.',
      thought_process: 'Check all possibilities.',
      algorithm: 'Iterative check.',
      code: '// Brute force code',
      complexity_time: 'O(N^2)',
      complexity_space: 'O(1)',
      tle_reason: 'Too slow.'
    },
    better_solution: {
      exists: false,
      explanation: 'None',
      code: '',
      complexity_time: '',
      complexity_space: ''
    },
    optimal_solution: {
      core_observation: 'Optimal state mapping.',
      why_it_works: 'Proves mathematical boundaries.',
      explanation: 'Step-by-step optimal walkthrough.',
      code: '// Optimal code',
      line_by_line_explanation: 'Variables and loops detailed.'
    },
    detailed_dry_run: 'Trace states.',
    complexity_analysis: {
      time_complexity: 'O(N)',
      time_complexity_reason: 'Single traversal.',
      space_complexity: 'O(N)',
      space_complexity_reason: 'State mapping.'
    },
    interview_discussion: {
      why_asked: 'Interview questions testing structures.',
      follow_ups: [],
      common_mistakes: [],
      edge_cases: [],
      how_to_explain: 'Start from basic and improve.'
    },
    similar_problems: {
      easier: [],
      similar: [],
      harder: []
    },
    key_takeaways: {
      pattern: 'None',
      important_observation: 'None',
      complexity: 'O(N)',
      interview_trick: 'None',
      common_pitfall: 'None'
    },
    alternative_approaches: 'None',
    edge_cases_checklist: [],
    reusable_template: '// template',
    confidence: 'low'
  };
}
