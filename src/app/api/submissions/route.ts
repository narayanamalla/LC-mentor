import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import {
  analyzeProblemMetadata,
  generateTopicNotes,
  generateSolutionAnalysis,
  ProblemMetadata,
  TopicNotes,
  SolutionAnalysis
} from '@/lib/gemini';
import { getProblemFromCatalog } from '@/lib/problems-catalog';
import { generateHTMLReport, generateLaTeXTemplate } from '@/lib/report';
import { sendEmailWithAttachment } from '@/lib/email';

// Generic template lookup to prevent AI formatting errors
function getGenericTemplate(topic: string): string {
  const t = topic.toLowerCase();
  if (t.includes('sliding window')) {
    return `// C++ Sliding Window Template
int left = 0, right = 0;
while (right < nums.size()) {
    // Expand window
    window.add(nums[right]);
    right++;
    
    // Shrink window if invalid
    while (window.invalid()) {
        window.remove(nums[left]);
        left++;
    }
}`;
  }
  if (t.includes('prefix sum')) {
    return `// C++ Prefix Sum Template
vector<int> prefix(n + 1, 0);
for (int i = 0; i < n; i++) {
    prefix[i + 1] = prefix[i] + nums[i];
}`;
  }
  if (t.includes('two pointer') || t.includes('two-pointer')) {
    return `// C++ Two Pointers Template
int left = 0, right = nums.size() - 1;
while (left < right) {
    if (condition) {
        left++;
    } else {
        right--;
    }
}`;
  }
  if (t.includes('binary search')) {
    return `// C++ Binary Search Template
int left = 0, right = nums.size() - 1;
while (left <= right) {
    int mid = left + (right - left) / 2;
    if (nums[mid] == target) return mid;
    if (nums[mid] < target) left = mid + 1;
    else right = mid - 1;
}`;
  }
  if (t.includes('graph') || t.includes('dfs') || t.includes('bfs')) {
    return `// C++ DFS Graph Traversal Template
vector<bool> visited(n, false);
void dfs(int u, vector<vector<int>>& adj) {
    visited[u] = true;
    for (int v : adj[u]) {
        if (!visited[v]) dfs(v, adj);
    }
}`;
  }
  if (t.includes('dynamic programming') || t.includes('dp')) {
    return `// C++ Memoized DP Template
vector<int> memo(n, -1);
int solve(int idx) {
    if (idx < 0) return 0;
    if (memo[idx] != -1) return memo[idx];
    return memo[idx] = max(solve(idx - 1), solve(idx - 2) + val);
}`;
  }
  return `// Generic C++ Loop Template
for (int i = 0; i < n; i++) {
    // State transitions
}`;
}

export async function POST(req: Request) {
  try {
    const { userId, problems: problemInput, date } = await req.json();

    if (!userId || !problemInput || !Array.isArray(problemInput)) {
      return NextResponse.json({ error: 'Missing userId or problems list' }, { status: 400 });
    }

    const reportDate = date || new Date().toISOString().split('T')[0];

    // 1. Authenticate or fallback/create user on-the-fly
    let { data: userProfile, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError || !userProfile) {
      const tempEmail = userId === '00000000-0000-0000-0000-000000000000' ? 'narayanamalla0008@gmail.com' : 'student@leetcode.com';
      const { data: newUser, error: insertError } = await supabaseAdmin
        .from('users')
        .insert({ id: userId, email: tempEmail, leetcode_username: 'sandbox' })
        .select()
        .single();
      
      if (insertError) {
        userProfile = { id: userId, email: tempEmail, leetcode_username: 'sandbox', created_at: new Date().toISOString() };
      } else {
        userProfile = newUser;
      }
    }

    const problemIds = problemInput.map((id: string | number) => Number(id));

    // 2. Fetch history to compute topic counts
    const { data: userHistory } = await supabaseAdmin
      .from('solved_problems')
      .select('*, problems(*)')
      .eq('user_id', userId);

    const allSolved = userHistory || [];
    const topicCounts: Record<string, number> = {};
    const difficultyCounts = { Easy: 0, Medium: 0, Hard: 0 };

    allSolved.forEach((sh: any) => {
      const p = sh.problems;
      if (p) {
        const diff = p.difficulty as 'Easy' | 'Medium' | 'Hard';
        if (difficultyCounts[diff] !== undefined) {
          difficultyCounts[diff]++;
        }
        if (p.topics && Array.isArray(p.topics)) {
          p.topics.forEach((t: string) => {
            topicCounts[t] = (topicCounts[t] || 0) + 1;
          });
        }
      }
    });

    // 3. Multi-Step Pipeline: Process each submitted problem
    const processedProblems: Array<{ id: number; title: string; difficulty: string; topics: string[] }> = [];
    const processedSolutions: Record<number, SolutionAnalysis> = {};
    const processedTopicNotes: Record<string, TopicNotes> = {};

    for (const problemId of problemIds) {
      // a. Get raw problem details from DB or Local Catalog
      let title = `LeetCode Problem ${problemId}`;
      let difficulty = 'Medium';
      let topics = ['Dynamic Programming'];

      // Query database
      const { data: dbProblem } = await supabaseAdmin
        .from('problems')
        .select('*')
        .eq('id', problemId)
        .single();

      if (dbProblem && !dbProblem.title.startsWith('LeetCode Problem ')) {
        title = dbProblem.title;
        difficulty = dbProblem.difficulty;
        topics = dbProblem.topics || [];
      } else {
        // Query local catalog
        const catalogProblem = await getProblemFromCatalog(problemId);
        if (catalogProblem) {
          title = catalogProblem.title;
          difficulty = catalogProblem.difficulty;
          topics = catalogProblem.topics;
        }
      }

      // b. Step A: Problem Analysis (Rule 2)
      console.log(`Step A: Analyzing problem ${problemId}...`);
      const verified = await analyzeProblemMetadata(title, difficulty, topics);
      
      // Upsert verified problem to DB
      await supabaseAdmin.from('problems').upsert({
        id: problemId,
        title: verified.problem,
        difficulty: verified.difficulty,
        topics: verified.topics,
      });

      // Track details
      processedProblems.push({
        id: problemId,
        title: verified.problem,
        difficulty: verified.difficulty,
        topics: verified.topics,
      });

      // Update topic counts for today's dynamic calculation
      verified.topics.forEach(t => {
        topicCounts[t] = (topicCounts[t] || 0) + 1;
      });

      // Store solved history record
      await supabaseAdmin.from('solved_problems').upsert({
        user_id: userId,
        problem_id: problemId,
        solved_date: reportDate,
      });

      // c. Step C: Solution Explanation for this problem (Rule 6)
      console.log(`Step C: Generating solution analysis for ${verified.problem}...`);
      const solution = await generateSolutionAnalysis(verified.problem, verified.difficulty, verified.topics);
      processedSolutions[problemId] = solution;
    }

    // 4. Step B: Topic Notes Generation
    const uniqueTopics = Array.from(new Set(processedProblems.flatMap(p => p.topics)));

    for (const topic of uniqueTopics) {
      // Check database cache first
      const { data: cached } = await supabaseAdmin
        .from('topic_notes')
        .select('*')
        .eq('topic', topic)
        .single();

      if (cached) {
        try {
          const parsed = JSON.parse(cached.latex_content);
          if (parsed && parsed.definition && parsed.when_to_use) {
            processedTopicNotes[topic] = parsed;
          } else {
            console.warn(`Cached topic notes for ${topic} are in an old format. Regenerating...`);
          }
        } catch {
          console.warn(`Failed to parse cached topic notes for ${topic}. Regenerating...`);
        }
      }

      if (!processedTopicNotes[topic]) {
        console.log(`Step B: Generating topic notes for ${topic}...`);
        const notes = await generateTopicNotes(topic);
        processedTopicNotes[topic] = notes;

        // Save to cache
        await supabaseAdmin.from('topic_notes').upsert({
          topic: topic,
          latex_content: JSON.stringify(notes),
          updated_at: new Date().toISOString(),
        });
      }
    }

    // 5. Build report template data
    // Map each problem to its primary (first) topic note block
    const reportTopics = processedProblems.map(p => {
      const primaryTopic = p.topics[0] || 'Dynamic Programming';
      const notes = processedTopicNotes[primaryTopic] || {
        definition: 'Conceptual programming block.',
        intuition: 'Intuitive pattern recognition.',
        when_to_use: [],
        common_mistakes: [],
        related_patterns: []
      };
      
      const solRaw = processedSolutions[p.id];
      const bruteCode = solRaw?.brute_force?.code || '';
      const optimalCode = solRaw?.optimal_solution?.code || '';
      const bruteForceDesc = solRaw?.brute_force?.intuition || 'Check all combinations.';
      const optimizedLogicDesc = solRaw?.optimal_solution?.explanation || 'Optimize space or lookup time.';
      const complexityTime = solRaw?.complexity_analysis?.time_complexity || 'O(N)';
      const complexitySpace = solRaw?.complexity_analysis?.space_complexity || 'O(1)';

      const whenToUseList = notes.when_to_use || [];
      const whenToUseBullets = whenToUseList.map((c, i) => `${i + 1}. ${c}`).join('\n');

      const mistakesList = notes.common_mistakes || [];
      const interviewTips = 'Common mistakes:\n' + mistakesList.map(m => `- ${m}`).join('\n');

      const similarProblems = notes.related_patterns || [];

      return {
        topic: `${primaryTopic} | LC ${p.id}: ${p.title}`,
        theory: notes.definition + '\n\n' + notes.intuition,
        patternRecognition: whenToUseBullets || '1. Contiguous subarray lookup needs.',
        templateCode: getGenericTemplate(primaryTopic),
        bruteForce: bruteForceDesc,
        optimizedLogic: optimizedLogicDesc,
        interviewTips: interviewTips,
        complexityAnalysis: `Time: ${complexityTime} | Space: ${complexitySpace}`,
        optimalCode: optimalCode || '// C++ optimal code',
        similarProblems: similarProblems
      };
    });

    const reportSolutions = processedProblems.map(p => {
      const sol = processedSolutions[p.id] || {
        problem_understanding: '',
        examples_and_dry_run: '',
        pattern_recognition: '',
        brute_force: { intuition: '', thought_process: '', algorithm: '', code: '', complexity_time: '', complexity_space: '', tle_reason: '' },
        better_solution: { exists: false, explanation: '', code: '', complexity_time: '', complexity_space: '' },
        optimal_solution: { core_observation: '', why_it_works: '', explanation: '', code: '', line_by_line_explanation: '' },
        detailed_dry_run: '',
        complexity_analysis: { time_complexity: '', time_complexity_reason: '', space_complexity: '', space_complexity_reason: '', best_case: '', average_case: '', worst_case: '' },
        interview_discussion: { why_asked: '', follow_ups: [], common_mistakes: [], edge_cases: [], how_to_explain: '' },
        similar_problems: { easier: [], similar: [], harder: [] },
        key_takeaways: { pattern: '', important_observation: '', complexity: '', interview_trick: '', common_pitfall: '' },
        alternative_approaches: '',
        edge_cases_checklist: [],
        reusable_template: ''
      };

      return {
        id: p.id,
        title: p.title,
        difficulty: p.difficulty,
        topics: p.topics,
        problemUnderstanding: sol.problem_understanding,
        examplesAndDryRun: sol.examples_and_dry_run,
        patternRecognition: sol.pattern_recognition,
        bruteForce: {
          intuition: sol.brute_force?.intuition || '',
          thoughtProcess: sol.brute_force?.thought_process || '',
          algorithm: sol.brute_force?.algorithm || '',
          code: sol.brute_force?.code || '',
          complexityTime: sol.brute_force?.complexity_time || '',
          complexitySpace: sol.brute_force?.complexity_space || '',
          tleReason: sol.brute_force?.tle_reason || ''
        },
        betterSolution: {
          exists: !!sol.better_solution?.exists,
          explanation: sol.better_solution?.explanation || '',
          code: sol.better_solution?.code || '',
          complexityTime: sol.better_solution?.complexity_time || '',
          complexitySpace: sol.better_solution?.complexity_space || ''
        },
        optimalSolution: {
          coreObservation: sol.optimal_solution?.core_observation || '',
          whyItWorks: sol.optimal_solution?.why_it_works || '',
          explanation: sol.optimal_solution?.explanation || '',
          code: sol.optimal_solution?.code || '',
          lineByLineExplanation: sol.optimal_solution?.line_by_line_explanation || ''
        },
        detailedDryRun: sol.detailed_dry_run,
        complexityAnalysis: {
          timeComplexity: sol.complexity_analysis?.time_complexity || '',
          timeComplexityReason: sol.complexity_analysis?.time_complexity_reason || '',
          spaceComplexity: sol.complexity_analysis?.space_complexity || '',
          spaceComplexityReason: sol.complexity_analysis?.space_complexity_reason || '',
          bestCase: sol.complexity_analysis?.best_case || '',
          averageCase: sol.complexity_analysis?.average_case || '',
          worstCase: sol.complexity_analysis?.worst_case || ''
        },
        interviewDiscussion: {
          whyAsked: sol.interview_discussion?.why_asked || '',
          followUps: sol.interview_discussion?.follow_ups || [],
          commonMistakes: sol.interview_discussion?.common_mistakes || [],
          edgeCases: sol.interview_discussion?.edge_cases || [],
          howToExplain: sol.interview_discussion?.how_to_explain || ''
        },
        similarProblems: {
          easier: sol.similar_problems?.easier || [],
          similar: sol.similar_problems?.similar || [],
          harder: sol.similar_problems?.harder || []
        },
        keyTakeaways: {
          pattern: sol.key_takeaways?.pattern || '',
          importantObservation: sol.key_takeaways?.important_observation || '',
          complexity: sol.key_takeaways?.complexity || '',
          interviewTrick: sol.key_takeaways?.interview_trick || '',
          commonPitfall: sol.key_takeaways?.common_pitfall || ''
        },
        alternativeApproaches: sol.alternative_approaches,
        edgeCasesChecklist: (sol.edge_cases_checklist || []).map(item => ({
          caseName: item.case_name || '',
          matters: !!item.matters,
          explanation: item.explanation || ''
        })),
        reusableTemplate: sol.reusable_template
      };
    });

    // Determine weak areas & recommendations deterministically
    const weakTopics = Object.entries(topicCounts)
      .filter(([_, count]) => count <= 1)
      .map(([topic]) => topic);

    if (weakTopics.length === 0) {
      const sorted = Object.entries(topicCounts).sort((a, b) => a[1] - b[1]);
      weakTopics.push(...sorted.slice(0, 2).map(([topic]) => topic));
    }

    const recommendations = weakTopics.map(topic => {
      const t = topic.toLowerCase();
      if (t.includes('sliding window')) {
        return `Solve 'Sliding Window Maximum' (LC 239) or 'Minimum Window Substring' (LC 76) to reinforce boundary shrinking logic.`;
      }
      if (t.includes('prefix sum')) {
        return `Solve 'Subarray Sum Equals K' (LC 560) to master subarray index difference lookups.`;
      }
      if (t.includes('two pointer')) {
        return `Solve '3Sum' (LC 15) to practice multi-pointer convergence patterns.`;
      }
      if (t.includes('binary search')) {
        return `Solve 'Search in Rotated Sorted Array' (LC 33) to verify binary partition conditions.`;
      }
      if (t.includes('graph')) {
        return `Solve 'Number of Islands' (LC 200) to understand connected component traversals.`;
      }
      if (t.includes('dynamic programming')) {
        return `Solve 'Coin Change' (LC 322) to practice bottom-up state transition relations.`;
      }
      return `Solve 2 more medium difficulty problems on ${topic} to master the pattern.`;
    });

    // Refetch history to get updated counts
    const { data: updatedHistory } = await supabaseAdmin
      .from('solved_problems')
      .select('*, problems(*)')
      .eq('user_id', userId);
    
    const finalAllSolved = updatedHistory || [];
    const totalSolved = finalAllSolved.length;

    const finalDifficultyCounts = { Easy: 0, Medium: 0, Hard: 0 };
    finalAllSolved.forEach((sh: any) => {
      const p = sh.problems;
      if (p) {
        const diff = p.difficulty as 'Easy' | 'Medium' | 'Hard';
        if (finalDifficultyCounts[diff] !== undefined) {
          finalDifficultyCounts[diff]++;
        }
      }
    });

    // Calculate streak
    const uniqueDates = Array.from(new Set(finalAllSolved.map((h: any) => h.solved_date)))
      .map(d => new Date(d))
      .sort((a, b) => b.getTime() - a.getTime());

    let streak = 0;
    const today = new Date();
    today.setHours(0,0,0,0);
    
    if (uniqueDates.length > 0) {
      let currentCheck = today;
      const mostRecent = uniqueDates[0];
      const diffTime = Math.abs(currentCheck.getTime() - mostRecent.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays <= 1) {
        streak = 1;
        currentCheck = mostRecent;
        for (let i = 1; i < uniqueDates.length; i++) {
          const prevDate = uniqueDates[i];
          const timeDiff = Math.abs(currentCheck.getTime() - prevDate.getTime());
          const dayDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
          if (dayDiff === 1) {
            streak++;
            currentCheck = prevDate;
          } else if (dayDiff > 1) {
            break;
          }
        }
      }
    }

    const reportData = {
      date: reportDate,
      problems: processedProblems,
      topics: reportTopics,
      solutions: reportSolutions,
      weakTopics: weakTopics.slice(0, 3),
      recommendations: recommendations.slice(0, 3),
      analytics: {
        totalSolved,
        streak: streak || 1,
        difficultyCounts: finalDifficultyCounts,
      },
    };

    // 6. Generate HTML & LaTeX
    const reportHtml = generateHTMLReport(reportData);
    const reportLatex = generateLaTeXTemplate(reportData);

    // 7. Compile LaTeX to PDF
    console.log('Compiling LaTeX report via online compiler...');
    let pdfBuffer = await compileLaTeXToPDF(reportLatex);
    let pdfFilename = `leetcode-mentor-${reportDate}.pdf`;
    let contentType = 'application/pdf';

    if (!pdfBuffer) {
      console.warn('LaTeX compilation failed or offline. Falling back to HTML report representation.');
      pdfBuffer = Buffer.from(reportHtml, 'utf-8');
      pdfFilename = `leetcode-mentor-${reportDate}.html`;
      contentType = 'text/html';
    }

    // 8. Store in Supabase Storage
    const bucketName = 'reports';
    const fileExtension = pdfFilename.split('.').pop();
    const filePath = `${userId}/${reportDate}-${Date.now()}.${fileExtension}`;

    // Find and delete the existing storage file for this day's report (if it exists) to prevent accumulation
    try {
      const { data: existingReport } = await supabaseAdmin
        .from('reports')
        .select('pdf_url')
        .eq('user_id', userId)
        .eq('report_date', reportDate)
        .maybeSingle();

      if (existingReport && existingReport.pdf_url) {
        const parts = existingReport.pdf_url.split('/reports/');
        if (parts.length > 1) {
          const oldFilePath = decodeURIComponent(parts[1]);
          console.log(`Deleting old report file from storage: ${oldFilePath}`);
          await supabaseAdmin.storage
            .from(bucketName)
            .remove([oldFilePath]);
        }
      }
    } catch (err) {
      console.warn('Failed to delete old report file from storage:', err);
    }

    const { data: uploadData } = await supabaseAdmin.storage
      .from(bucketName)
      .upload(filePath, pdfBuffer, {
        contentType,
        upsert: true,
      });

    let publicUrl = '';
    if (uploadData) {
      const { data: publicUrlData } = supabaseAdmin.storage
        .from(bucketName)
        .getPublicUrl(filePath);
      publicUrl = publicUrlData.publicUrl;
    } else {
      publicUrl = `/api/reports/download?path=${encodeURIComponent(filePath)}`;
    }

    // Save report reference
    await supabaseAdmin.from('reports').upsert({
      user_id: userId,
      report_date: reportDate,
      pdf_url: publicUrl,
    });

    // 9. Send Email alert automatically
    try {
      await sendEmailWithAttachment({
        to: userProfile.email,
        subject: `LeetCode Mentor Revision Report - ${reportDate}`,
        text: `Hello!\n\nHere is your daily revision report for LeetCode practice.\nTotal Solved: ${totalSolved}\nStreak: ${streak} days\n\nKeep studying!`,
        html: reportHtml,
        pdfBuffer,
        pdfFilename,
        contentType,
      });
    } catch (emailErr) {
      console.warn('SMTP Email alert failed to send:', emailErr);
    }

    return NextResponse.json({
      success: true,
      report: reportData,
      pdfUrl: publicUrl,
    });
  } catch (error: any) {
    console.error('Core Logic API Route Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

async function compileLaTeXToPDF(latexContent: string): Promise<Buffer | null> {
  // Try YtoTech LaTeX-on-HTTP first (more reliable JSON endpoint)
  try {
    console.log('Attempting LaTeX compilation via latex.ytotech.com...');
    const response = await fetch('https://latex.ytotech.com/builds/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        compiler: 'pdflatex',
        resources: [
          {
            main: true,
            content: latexContent
          }
        ],
      }),
    });

    if (response.ok) {
      const arrayBuffer = await response.arrayBuffer();
      console.log('LaTeX compiled successfully via latex.ytotech.com!');
      return Buffer.from(arrayBuffer);
    } else {
      const errLogs = await response.text();
      console.warn('latex.ytotech.com failed with status:', response.status, errLogs.substring(0, 300));
    }
  } catch (error) {
    console.error('latex.ytotech.com request failed:', error);
  }

  // Fallback to LaTeX.online
  try {
    console.log('Attempting LaTeX compilation via latex.online...');
    const response = await fetch('https://latex.online/compile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `text=${encodeURIComponent(latexContent)}`,
    });

    if (response.ok) {
      const arrayBuffer = await response.arrayBuffer();
      console.log('LaTeX compiled successfully via latex.online!');
      return Buffer.from(arrayBuffer);
    } else {
      const errorText = await response.text();
      console.warn('latex.online compile failed with status:', response.status, errorText.substring(0, 300));
    }
  } catch (error) {
    console.error('latex.online request failed:', error);
  }

  return null;
}
