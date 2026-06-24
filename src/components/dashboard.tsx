'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/components/auth-provider';
import { useThemeInjector } from '@/lib/theme';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast, Toaster } from 'sonner';
import { 
  Sparkles, 
  Flame, 
  BookOpen, 
  TrendingUp, 
  Download, 
  Plus, 
  LogOut, 
  CheckCircle,
  HelpCircle,
  FileText,
  Search,
  BookMarked
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Cell,
  PieChart,
  Pie
} from 'recharts';

export default function Dashboard() {
  useThemeInjector();
  const { user, signOut } = useAuth();
  
  // Tab states
  const [activeTab, setActiveTab] = useState('home');

  // Input states
  const [leetcodeUsername, setLeetcodeUsername] = useState('');
  const [manualProblemIds, setManualProblemIds] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Fetch metrics data states
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<{
    streak: number;
    totalSolved: number;
    difficultyCounts: { Easy: number; Medium: number; Hard: number };
    topicCounts: Record<string, number>;
    solvedToday: Array<{ id: number; title: string; difficulty: string; topics: string[] }>;
    reports: Array<{ id: string; report_date: string; pdf_url: string }>;
  }>({
    streak: 0,
    totalSolved: 0,
    difficultyCounts: { Easy: 0, Medium: 0, Hard: 0 },
    topicCounts: {},
    solvedToday: [],
    reports: [],
  });

  const [searchQuery, setSearchQuery] = useState('');

  // Fetch statistics from backend API
  const fetchAnalytics = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/analytics?userId=${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setDashboardData({
          streak: data.streak || 0,
          totalSolved: data.totalSolved || 0,
          difficultyCounts: data.difficultyCounts || { Easy: 0, Medium: 0, Hard: 0 },
          topicCounts: data.topicCounts || {},
          solvedToday: data.solvedToday || [],
          reports: data.reports || [],
        });
      }
    } catch (err) {
      console.error('Analytics loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [user]);

  // Handle problem submissions
  const handleProblemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    let problemsToSubmit: number[] = [];

    if (manualProblemIds.trim()) {
      problemsToSubmit = manualProblemIds
        .split(',')
        .map(id => parseInt(id.trim()))
        .filter(id => !isNaN(id));
    } else if (leetcodeUsername.trim()) {
      // Simulate LeetCode sync (fetching top list for presentation)
      toast.loading('Syncing problems from LeetCode account...');
      problemsToSubmit = [560, 76, 3]; // standard demonstration list
    }

    if (problemsToSubmit.length === 0) {
      toast.error('Please enter LeetCode username or enter manually solved problem IDs');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          problems: problemsToSubmit,
          date: new Date().toISOString().split('T')[0],
        }),
      });

      if (res.ok) {
        const result = await res.json();
        toast.success('Successfully solved problems tracked! Revision notes compiled and emailed.');
        setManualProblemIds('');
        setLeetcodeUsername('');
        fetchAnalytics();
      } else {
        const errorData = await res.json();
        toast.error(errorData.error || 'Submission failed');
      }
    } catch (err) {
      toast.error('Connection error during submission pipeline');
    } finally {
      setSubmitting(false);
    }
  };

  // UI Charts Data Transformations
  const difficultyChartData = useMemo(() => {
    const counts = dashboardData.difficultyCounts;
    return [
      { name: 'Easy', value: counts.Easy, color: '#10b981' },
      { name: 'Medium', value: counts.Medium, color: '#f59e0b' },
      { name: 'Hard', value: counts.Hard, color: '#ef4444' },
    ].filter(item => item.value > 0);
  }, [dashboardData.difficultyCounts]);

  const topicsChartData = useMemo(() => {
    return Object.entries(dashboardData.topicCounts).map(([topic, count]) => ({
      topic,
      count,
    })).sort((a, b) => b.count - a.count).slice(0, 5);
  }, [dashboardData.topicCounts]);

  const weakTopicInsights = useMemo(() => {
    // Underperform criteria: count < 2 on a known topic
    const weak = [];
    for (const [topic, count] of Object.entries(dashboardData.topicCounts)) {
      if (count <= 1) {
        weak.push(topic);
      }
    }
    return weak.slice(0, 3);
  }, [dashboardData.topicCounts]);

  // Filter archived reports
  const filteredReports = useMemo(() => {
    return dashboardData.reports.filter(r => 
      r.report_date.includes(searchQuery)
    );
  }, [dashboardData.reports, searchQuery]);

  return (
    <div className="relative min-h-screen bg-[#F8FAFC] bg-gradient-to-b from-[#F8FAFC] to-[#EEF2F6] text-slate-800 font-sans antialiased overflow-hidden selection:bg-blue-500/20 selection:text-blue-900">
      {/* Ambient Glow Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-400/8 blur-[120px] pointer-events-none animate-drift" />
      <div className="absolute bottom-[20%] right-[-10%] w-[45%] h-[45%] rounded-full bg-sky-400/8 blur-[150px] pointer-events-none animate-drift-slow" />
      <div className="absolute top-[40%] right-[15%] w-[300px] h-[300px] rounded-full bg-indigo-400/5 blur-[90px] pointer-events-none" />

      {/* Top Header */}
      <header className="border-b border-blue-100/80 bg-white/70 backdrop-blur-xl sticky top-0 z-50 shadow-[0_2px_20px_rgba(59,130,246,0.03)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-12 h-12 rounded-xl overflow-hidden flex items-center justify-center bg-white border border-slate-200 shadow-sm p-0.5">
              <img src="/Logo.png" alt="LeetCode Mentor Logo" className="w-full h-full object-contain" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight text-slate-900">LeetCode Mentor</span>
              <span className="relative flex items-center gap-1.5 px-2.5 py-0.5 text-[9px] font-bold tracking-wider uppercase bg-blue-50 border border-blue-200 text-blue-600 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.1)]">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                AI Agent
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200/80">
              <div className="w-5 h-5 rounded-full bg-blue-600/10 text-blue-600 border border-blue-500/20 flex items-center justify-center text-[10px] font-bold">
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </div>
              <span className="text-slate-600 text-xs hidden md:inline">{user?.email}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={signOut}
              className="text-slate-500 hover:text-slate-900 hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-all duration-300 flex items-center gap-2 rounded-xl"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-4">
            <TabsList className="bg-slate-100 border border-slate-200/80 p-1 rounded-xl h-auto gap-1">
              <TabsTrigger 
                value="home" 
                className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-[0_2px_10px_rgba(59,130,246,0.1)] text-slate-500 hover:text-slate-800 font-semibold px-4 py-2 rounded-lg transition-all duration-200 text-xs sm:text-sm cursor-pointer"
              >
                Dashboard
              </TabsTrigger>
              <TabsTrigger 
                value="analytics" 
                className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-[0_2px_10px_rgba(59,130,246,0.1)] text-slate-500 hover:text-slate-800 font-semibold px-4 py-2 rounded-lg transition-all duration-200 text-xs sm:text-sm cursor-pointer"
              >
                Analytics
              </TabsTrigger>
              <TabsTrigger 
                value="reports" 
                className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-[0_2px_10px_rgba(59,130,246,0.1)] text-slate-500 hover:text-slate-800 font-semibold px-4 py-2 rounded-lg transition-all duration-200 text-xs sm:text-sm cursor-pointer"
              >
                Revision Reports ({dashboardData.reports.length})
              </TabsTrigger>
            </TabsList>

            <div className="hidden lg:flex items-center gap-2 text-xs text-slate-500 bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-xl backdrop-blur-md">
              <span className="text-blue-500">“</span>
              <span className="italic font-medium text-slate-600">LeetCode tracks submissions. LeetCode Mentor tracks understanding.</span>
              <span className="text-blue-500">”</span>
            </div>
          </div>

          {/* Home / Daily Entry Dashboard */}
          <TabsContent value="home" className="space-y-6 outline-none">
            {/* Quick Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Solve Streak Card */}
              <div className="glass-card glass-card-hover rounded-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 rounded-full blur-2xl group-hover:bg-orange-500/10 transition-all duration-500" />
                <div className="p-6 flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Solve Streak</p>
                    <h3 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-amber-500 mt-1 flex items-baseline gap-2">
                      {dashboardData.streak} <span className="text-xs font-semibold text-orange-605/90 uppercase tracking-widest">Days Active</span>
                    </h3>
                    {/* Decorative last-7-days mini bar indicator */}
                    <div className="flex items-center gap-1.5 mt-4">
                      {Array.from({ length: 7 }).map((_, i) => {
                        const isActive = i < Math.min(dashboardData.streak, 7);
                        return (
                          <div 
                            key={i} 
                            className={`h-1.5 w-6 rounded-full transition-all duration-500 ${
                              isActive 
                                ? 'bg-gradient-to-r from-orange-500 to-amber-500 shadow-[0_0_6px_rgba(249,115,22,0.3)]' 
                                : 'bg-slate-200'
                            }`} 
                          />
                        );
                      })}
                    </div>
                  </div>
                  <div className="p-4 bg-orange-50 border border-orange-100 text-orange-500 rounded-2xl group-hover:scale-110 transition-all duration-300 relative shadow-inner">
                    <Flame className="w-6 h-6 animate-pulse" />
                  </div>
                </div>
              </div>

              {/* Total Solved Card */}
              <div className="glass-card glass-card-hover rounded-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-all duration-500" />
                <div className="p-6 flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Solved</p>
                    <h3 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-600 mt-1 flex items-baseline gap-2">
                      {dashboardData.totalSolved} <span className="text-xs font-semibold text-blue-605/90 uppercase tracking-widest">Questions</span>
                    </h3>
                    {/* Decorative simple mini sparkline */}
                    <div className="flex items-end gap-1 h-3 mt-4">
                      {[30, 45, 35, 60, 50, 75, 90].map((h, i) => (
                        <div 
                          key={i} 
                          style={{ height: `${h}%` }}
                          className={`w-1 rounded-t-full bg-blue-200/60 group-hover:bg-blue-400 transition-all duration-500 ${
                            i === 6 ? 'bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.3)]' : ''
                          }`} 
                        />
                      ))}
                    </div>
                  </div>
                  <div className="p-4 bg-blue-50 border border-blue-100 text-blue-500 rounded-2xl group-hover:scale-110 transition-all duration-300 shadow-inner">
                    <BookMarked className="w-6 h-6" />
                  </div>
                </div>
              </div>

              {/* Weak Topics Card */}
              <div className="glass-card glass-card-hover rounded-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl group-hover:bg-rose-500/10 transition-all duration-500" />
                <div className="p-6 flex items-center justify-between">
                  <div className="space-y-1 w-[70%]">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Weak Topics</p>
                    <h3 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-rose-600 to-pink-650 mt-1 flex items-baseline gap-2">
                      {weakTopicInsights.length || 0} <span className="text-xs font-semibold text-rose-605/90 uppercase tracking-widest">Areas</span>
                    </h3>
                    <div className="flex flex-wrap gap-1 mt-4">
                      {weakTopicInsights.length === 0 ? (
                        <span className="text-[10px] text-slate-400 font-medium">All targets stable</span>
                      ) : (
                        weakTopicInsights.map((t, idx) => (
                          <span key={idx} className="text-[9px] font-bold bg-rose-50 border border-rose-100 text-rose-600 px-1.5 py-0.5 rounded-full">
                            {t}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                  <div className="p-4 bg-rose-50 border border-rose-100 text-rose-550 rounded-2xl group-hover:scale-110 transition-all duration-300 shadow-inner">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Submission Form */}
              <div className="lg:col-span-2 glass-card rounded-2xl border-l-4 border-l-blue-600 shadow-2xl relative overflow-hidden p-6">
                <div className="absolute -left-10 top-0 w-32 h-32 bg-blue-500/4 rounded-full blur-3xl pointer-events-none" />
                <div className="mb-6">
                  <h3 className="text-slate-900 text-lg font-bold flex items-center gap-2">
                    <Plus className="w-5 h-5 text-blue-500" /> Track Daily Progress
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Input your daily practice. Our AI agent instantly converts it to formatted LaTeX theory summaries & revision targets.
                  </p>
                </div>

                <form onSubmit={handleProblemSubmit} className="space-y-6 relative z-10">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Option A: Enter Solved LeetCode IDs (Recommended)</label>
                    <div className="relative rounded-xl bg-slate-50 border border-slate-205 focus-within:ring-2 focus-within:ring-blue-500/25 focus-within:border-blue-500/80 transition-all duration-300 group">
                      <div className="absolute left-3.5 top-3.5 text-slate-400 group-focus-within:text-blue-500 font-bold select-none text-sm">#</div>
                      <input
                        type="text"
                        placeholder="e.g. 560, 76, 239"
                        value={manualProblemIds}
                        onChange={(e) => {
                          setManualProblemIds(e.target.value);
                          setLeetcodeUsername('');
                        }}
                        className="w-full pl-8 pr-4 py-3 bg-transparent text-slate-800 placeholder-slate-400 focus:outline-none text-sm font-mono"
                      />
                    </div>
                    <p className="text-[10px] text-slate-550">Provide comma-separated problem IDs. Solved problems will be classified and compiled into theory revision summaries.</p>
                  </div>

                  <div className="relative py-2 flex items-center justify-center">
                    <div className="absolute inset-0 flex items-center" aria-hidden="true">
                      <div className="w-full border-t border-slate-200"></div>
                    </div>
                    <div className="relative flex justify-center text-[10px] font-extrabold tracking-widest">
                      <span className="bg-white border border-slate-200 px-3 py-1 rounded-full text-slate-450 uppercase shadow-sm">OR</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Option B: Track via LeetCode Username</label>
                    <div className="relative rounded-xl bg-slate-50 border border-slate-205 focus-within:ring-2 focus-within:ring-blue-500/25 focus-within:border-blue-500/80 transition-all duration-300 group">
                      <div className="absolute left-3.5 top-3.5 text-slate-400 group-focus-within:text-blue-500 font-bold select-none text-sm">@</div>
                      <input
                        type="text"
                        placeholder="Enter LeetCode username"
                        value={leetcodeUsername}
                        onChange={(e) => {
                          setLeetcodeUsername(e.target.value);
                          setManualProblemIds('');
                        }}
                        className="w-full pl-8 pr-4 py-3 bg-transparent text-slate-800 placeholder-slate-400 focus:outline-none text-sm"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={submitting}
                    className="shimmer-btn w-full text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2.5 transition-all duration-300 text-sm shadow-lg shadow-blue-500/10 cursor-pointer"
                  >
                    {submitting ? (
                      <>
                        <Sparkles className="w-4 h-4 animate-spin" />
                        Compiling Notes & Emailing PDF...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-white" />
                        Generate Daily PDF Report
                      </>
                    )}
                  </Button>
                </form>
              </div>

              {/* Today's solved list */}
              <div className="glass-card rounded-2xl border-l-4 border-l-emerald-500 shadow-2xl relative overflow-hidden p-6">
                <div className="absolute -right-10 top-0 w-32 h-32 bg-emerald-500/3 rounded-full blur-3xl pointer-events-none" />
                <div className="mb-6">
                  <h3 className="text-slate-900 text-lg font-bold flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-emerald-500" /> Solved Today
                  </h3>
                  <p className="text-xs text-slate-505 mt-1">
                    Problems submitted during this session.
                  </p>
                </div>

                <div>
                  {dashboardData.solvedToday.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                      <div className="w-16 h-16 rounded-full border-2 border-dashed border-slate-200 flex items-center justify-center mb-4 text-slate-400 bg-slate-50 animate-pulse">
                        <CheckCircle className="w-8 h-8 stroke-[1.5]" />
                      </div>
                      <p className="text-sm font-semibold text-slate-600">Zero active solves today</p>
                      <p className="text-[11px] text-slate-450 max-w-[200px] mt-1.5 leading-relaxed">
                        Log your solved questions to trigger AI topic analysis.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                      {dashboardData.solvedToday.map((p, idx) => (
                        <div key={idx} className="p-3.5 rounded-xl bg-slate-50/85 border border-slate-100 hover:border-blue-105 hover:bg-white transition-all duration-300 flex justify-between items-start group">
                          <div className="space-y-1">
                            <div className="font-semibold text-xs text-slate-800 group-hover:text-blue-600 transition-colors">
                              LC {p.id}: {p.title}
                            </div>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {p.topics.map((t, i) => (
                                <span key={i} className="text-[9px] font-bold bg-blue-550/10 border border-blue-500/20 text-blue-600 px-2 py-0.5 rounded-full">
                                  {t}
                                </span>
                              ))}
                            </div>
                          </div>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border ${
                            p.difficulty === 'Easy' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' :
                            p.difficulty === 'Medium' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' :
                            'bg-rose-500/10 text-rose-600 border-rose-500/20'
                          }`}>
                            {p.difficulty}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Analytics Heatmaps & Topic Charts */}
          <TabsContent value="analytics" className="space-y-6 outline-none">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Difficulty breakdown */}
              <div className="glass-card rounded-2xl border border-blue-100/50 shadow-sm p-6">
                <div className="mb-4">
                  <h3 className="text-slate-900 text-lg font-bold">Difficulty Distribution</h3>
                  <p className="text-xs text-slate-500">Ratio of questions solved by level.</p>
                </div>
                <div className="h-64 flex items-center justify-center">
                  {difficultyChartData.length === 0 ? (
                    <span className="text-slate-400 text-sm">No submissions recorded yet.</span>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={difficultyChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {difficultyChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                          itemStyle={{ color: '#1e293b' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Topic Distribution */}
              <div className="glass-card rounded-2xl border border-blue-100/50 shadow-sm p-6">
                <div className="mb-4">
                  <h3 className="text-slate-900 text-lg font-bold">Top Knowledge Vectors</h3>
                  <p className="text-xs text-slate-500">Total solved occurrences sorted by topic.</p>
                </div>
                <div className="h-64">
                  {topicsChartData.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-slate-400 text-sm">No topics tracked.</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={topicsChartData}>
                        <XAxis dataKey="topic" stroke="#64748b" fontSize={11} tickLine={false} />
                        <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                          itemStyle={{ color: '#1e293b' }}
                        />
                        <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </div>

            {/* Weak Areas Alerts */}
            <div className="glass-card rounded-2xl border-l-4 border-l-orange-500/80 shadow-sm relative overflow-hidden p-6">
              <div className="mb-6">
                <h3 className="text-slate-900 text-lg font-bold flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-orange-500 animate-pulse" /> Focus Weak Areas
                </h3>
                <p className="text-xs text-slate-505 mt-1">
                  Topics with limited entries. Re-solving questions in these domains strengthens system cognitive anchors.
                </p>
              </div>

              <div>
                {weakTopicInsights.length === 0 ? (
                  <div className="text-center py-6 text-slate-400 text-sm">
                    No analytics alerts! Maintain uniform topic distribution to protect this status.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {weakTopicInsights.map((topic, i) => (
                      <div key={i} className="p-4 rounded-xl bg-slate-50/80 border border-slate-100 hover:border-blue-105 hover:bg-white transition-all duration-300 flex flex-col justify-between group">
                        <div>
                          <span className="text-[9px] text-rose-500 font-extrabold uppercase tracking-wider">Alert Weak Point</span>
                          <h4 className="text-base font-bold text-slate-900 mt-1 group-hover:text-blue-600 transition-colors">{topic}</h4>
                        </div>
                        <div className="mt-4 pt-3 border-t border-slate-150 text-xs text-slate-500 flex items-center justify-between">
                          <span>Total Solves: {dashboardData.topicCounts[topic] || 0}</span>
                          <span className="text-blue-600 font-semibold cursor-pointer hover:underline flex items-center gap-1" onClick={() => {
                            setActiveTab('home');
                            setManualProblemIds('560');
                          }}>Practice Now &rarr;</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Archived PDF Reports */}
          <TabsContent value="reports" className="space-y-6 outline-none">
            <div className="glass-card rounded-2xl border border-blue-100/50 shadow-sm p-6">
              <div className="mb-6">
                <h3 className="text-slate-900 text-lg font-bold">Revision Reports Archive</h3>
                <p className="text-xs text-slate-550 mt-1">
                  Search, review and download historical daily learning PDFs.
                </p>
              </div>

              <div className="space-y-4">
                <div className="relative group">
                  <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                  <input
                    type="text"
                    placeholder="Search by date (YYYY-MM-DD)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-205 text-slate-800 placeholder-slate-450 focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 transition-all duration-300 text-sm"
                  />
                </div>

                {filteredReports.length === 0 ? (
                  <div className="text-center py-12 text-slate-450 text-sm">
                    No historical revision logs match this filter query.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {filteredReports.map((report, idx) => (
                      <div key={idx} className="py-4 flex items-center justify-between first:pt-0 last:pb-0 group">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-50 border border-blue-100 text-blue-500 rounded-xl group-hover:scale-105 transition-all">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-semibold text-sm text-slate-850 group-hover:text-blue-600 transition-colors">Daily Learning Report</p>
                            <p className="text-[10px] font-medium text-slate-400 mt-0.5">{report.report_date}</p>
                          </div>
                        </div>
                        <a 
                          href={report.pdf_url} 
                          target="_blank" 
                          rel="noreferrer"
                          className="px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-100 hover:bg-blue-600 hover:text-white text-blue-600 transition-all flex items-center gap-1.5 text-xs font-semibold"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Download
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Floating Status Snackbar */}
      <div className="fixed bottom-6 left-6 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-white/90 border border-blue-100 shadow-2xl animate-slide-in text-xs text-slate-850">
        <span className="relative flex h-2 w-2">
          {submitting ? (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-450 opacity-75"></span>
          ) : (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-450 opacity-75"></span>
          )}
          <span className={`relative inline-flex rounded-full h-2 w-2 ${submitting ? 'bg-blue-600' : 'bg-emerald-500'}`}></span>
        </span>
        <span className="text-slate-700 font-medium">
          {submitting ? 'Compiling study notes...' : 'AI Engine: Online'}
        </span>
      </div>

      <Toaster theme="light" />
    </div>
  );

}
