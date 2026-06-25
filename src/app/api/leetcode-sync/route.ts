import { NextResponse } from 'next/server';
import { fetchRecentSolvedProblemsForUser } from '@/lib/problems-catalog';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get('username');

    if (!username) {
      return NextResponse.json({ error: 'Missing username parameter' }, { status: 400 });
    }

    console.log(`Syncing LeetCode profile for username: ${username}`);
    const problems = await fetchRecentSolvedProblemsForUser(username);
    
    return NextResponse.json({ success: true, problems });
  } catch (error: any) {
    console.error('Error in leetcode-sync API route:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
