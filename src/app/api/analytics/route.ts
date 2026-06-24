import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
  }

  try {
    // 1. Fetch solved history
    const { data: solvedData } = await supabaseAdmin
      .from('solved_problems')
      .select('*, problems(*)')
      .eq('user_id', userId);

    const solved = solvedData || [];

    // Calculate streak
    const uniqueDates = Array.from(new Set(solved.map((h: any) => h.solved_date)))
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
          } else {
            break;
          }
        }
      }
    }

    // Analytics breakdown
    const difficultyCounts = { Easy: 0, Medium: 0, Hard: 0 };
    const topicCounts: Record<string, number> = {};

    solved.forEach((sh: any) => {
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

    // 2. Fetch past reports
    const { data: reportsData } = await supabaseAdmin
      .from('reports')
      .select('*')
      .eq('user_id', userId)
      .order('report_date', { ascending: false });

    return NextResponse.json({
      streak,
      totalSolved: solved.length,
      difficultyCounts,
      topicCounts,
      solvedToday: solved.filter((s: any) => s.solved_date === today.toISOString().split('T')[0]).map((s: any) => s.problems),
      reports: reportsData || [],
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
