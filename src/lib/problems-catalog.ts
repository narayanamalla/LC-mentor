import https from 'https';

export interface CatalogProblem {
  id: number;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  topics: string[];
}

export const PROBLEMS_CATALOG: Record<number, CatalogProblem> = {
  1: { id: 1, title: 'Two Sum', difficulty: 'Easy', topics: ['Hash Table', 'Array'] },
  3: { id: 3, title: 'Longest Substring Without Repeating Characters', difficulty: 'Medium', topics: ['Sliding Window', 'Hash Table', 'String'] },
  15: { id: 15, title: '3Sum', difficulty: 'Medium', topics: ['Two Pointers', 'Sorting', 'Array'] },
  33: { id: 33, title: 'Search in Rotated Sorted Array', difficulty: 'Medium', topics: ['Binary Search', 'Array'] },
  70: { id: 70, title: 'Climbing Stairs', difficulty: 'Easy', topics: ['Dynamic Programming'] },
  76: { id: 76, title: 'Minimum Window Substring', difficulty: 'Hard', topics: ['Sliding Window', 'Hash Table', 'String'] },
  200: { id: 200, title: 'Number of Islands', difficulty: 'Medium', topics: ['Graphs', 'DFS', 'BFS'] },
  239: { id: 239, title: 'Sliding Window Maximum', difficulty: 'Hard', topics: ['Sliding Window', 'Heap', 'Monotonic Queue'] },
  322: { id: 322, title: 'Coin Change', difficulty: 'Medium', topics: ['Dynamic Programming', 'BFS'] },
  560: { id: 560, title: 'Subarray Sum Equals K', difficulty: 'Medium', topics: ['Prefix Sum', 'Hash Table', 'Array'] },
  704: { id: 704, title: 'Binary Search', difficulty: 'Easy', topics: ['Binary Search', 'Array'] },
};

function fetchJson(url: string, options: any = {}): Promise<any> {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (err) {
          reject(err);
        }
      });
    });
    req.on('error', reject);
    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

// In-memory cache of the full LeetCode problems list
let leetcodeAllProblemsCache: any = null;

export async function fetchProblemFromLeetCode(id: number): Promise<CatalogProblem | null> {
  try {
    if (!leetcodeAllProblemsCache) {
      console.log('Fetching problems index from LeetCode...');
      const response = await fetchJson('https://leetcode.com/api/problems/all/');
      if (response && response.stat_status_pairs) {
        leetcodeAllProblemsCache = response.stat_status_pairs;
      }
    }

    if (!leetcodeAllProblemsCache) return null;

    const found = leetcodeAllProblemsCache.find((p: any) => p.stat.frontend_question_id === id);
    if (!found) return null;

    const title = found.stat.question__title;
    const slug = found.stat.question__title_slug;
    const diffLevel = found.difficulty.level;
    const difficulty = diffLevel === 1 ? 'Easy' : diffLevel === 2 ? 'Medium' : 'Hard';

    // Fetch topics using GraphQL
    const query = `
      query getQuestionDetail($titleSlug: String!) {
        question(titleSlug: $titleSlug) {
          topicTags {
            name
          }
        }
      }
    `;

    const body = JSON.stringify({
      query,
      variables: { titleSlug: slug }
    });

    const headers = {
      'Content-Type': 'application/json',
      'Referer': 'https://leetcode.com'
    };

    const gqlRes = await fetchJson('https://leetcode.com/graphql', {
      method: 'POST',
      headers,
      body
    });

    const topics = (gqlRes.data?.question?.topicTags || []).map((t: any) => t.name);

    return { id, title, difficulty, topics };
  } catch (error) {
    console.error(`Failed to fetch live LeetCode problem ${id}:`, error);
    return null;
  }
}

export async function getProblemFromCatalog(problemId: number): Promise<CatalogProblem | null> {
  // Try fetching from live LeetCode API first
  const liveProblem = await fetchProblemFromLeetCode(problemId);
  if (liveProblem) {
    return liveProblem;
  }
  // Fallback to static catalog
  return PROBLEMS_CATALOG[problemId] || null;
}
