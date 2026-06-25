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

export async function getProblemIdFromSlug(slug: string): Promise<number | null> {
  try {
    if (!leetcodeAllProblemsCache) {
      console.log('Fetching problems index from LeetCode...');
      const response = await fetchJson('https://leetcode.com/api/problems/all/');
      if (response && response.stat_status_pairs) {
        leetcodeAllProblemsCache = response.stat_status_pairs;
      }
    }

    if (leetcodeAllProblemsCache) {
      const found = leetcodeAllProblemsCache.find((p: any) => p.stat.question__title_slug === slug);
      if (found) {
        return Number(found.stat.frontend_question_id);
      }
    }

    // Fallback: Query GraphQL directly for this specific slug
    console.log(`Slug ${slug} not found in cache. Querying LeetCode GraphQL...`);
    const query = `
      query getQuestionDetail($titleSlug: String!) {
        question(titleSlug: $titleSlug) {
          questionFrontendId
        }
      }
    `;
    const body = JSON.stringify({
      query,
      variables: { titleSlug: slug }
    });
    const headers = {
      'Content-Type': 'application/json',
      'Referer': 'https://leetcode.com',
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    };
    const gqlRes = await fetchJson('https://leetcode.com/graphql', {
      method: 'POST',
      headers,
      body
    });
    const frontendId = gqlRes?.data?.question?.questionFrontendId;
    return frontendId ? Number(frontendId) : null;
  } catch (error) {
    console.error(`Error looking up problem ID for slug ${slug}:`, error);
    return null;
  }
}

export async function fetchRecentSolvedProblemsForUser(username: string, limit: number = 20): Promise<number[]> {
  try {
    const query = `
      query recentSubmissions($username: String!, $limit: Int!) {
        recentSubmissionList(username: $username, limit: $limit) {
          title
          titleSlug
          timestamp
          statusDisplay
          lang
        }
      }
    `;

    const body = JSON.stringify({
      query,
      variables: { username, limit }
    });

    const headers = {
      'Content-Type': 'application/json',
      'Referer': `https://leetcode.com/u/${username}/`,
      'Origin': 'https://leetcode.com',
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    };

    const res = await fetch('https://leetcode.com/graphql', {
      method: 'POST',
      headers,
      body
    });

    if (!res.ok) {
      console.error(`LeetCode GraphQL error: ${res.status} ${res.statusText}`);
      return [];
    }

    const data = await res.json();
    const submissions = data?.data?.recentSubmissionList || [];
    
    // Filter for Accepted submissions
    const accepted = submissions.filter((sub: any) => sub.statusDisplay === 'Accepted');
    
    if (accepted.length === 0) {
      return [];
    }

    // Map titleSlug to problem ID using our lookup
    const problemIdsSet = new Set<number>();
    
    for (const sub of accepted) {
      const slug = sub.titleSlug;
      const problemId = await getProblemIdFromSlug(slug);
      if (problemId) {
        problemIdsSet.add(problemId);
      }
    }

    // Return unique problem IDs, up to 5
    return Array.from(problemIdsSet).slice(0, 5);
  } catch (error) {
    console.error(`Failed to fetch recent solved problems for user ${username}:`, error);
    return [];
  }
}

