'use client';

import React, { useState } from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  Terminal, 
  CheckCircle, 
  BookOpen, 
  Code, 
  FileText, 
  Brain, 
  Layers,
  ChevronRight,
  Flame,
  Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/auth-provider';
import { toast } from 'sonner';

interface LandingPageProps {
  onGetStarted: () => void;
  onSandboxStart: () => void;
}

export default function LandingPage({ onGetStarted, onSandboxStart }: LandingPageProps) {
  const [activeTab, setActiveTab] = useState<'input' | 'latex' | 'email'>('input');

  return (
    <div className="relative min-h-screen bg-[#F8FAFC] bg-gradient-to-b from-[#F8FAFC] to-[#EEF2F6] text-slate-800 font-sans antialiased overflow-hidden selection:bg-blue-500/20 selection:text-blue-900">
      {/* Ambient Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-400/8 blur-[120px] pointer-events-none animate-drift" />
      <div className="absolute bottom-[20%] right-[-10%] w-[45%] h-[45%] rounded-full bg-sky-400/8 blur-[150px] pointer-events-none animate-drift-slow" />
      <div className="absolute top-[40%] right-[15%] w-[300px] h-[300px] rounded-full bg-indigo-400/5 blur-[90px] pointer-events-none" />

      {/* Navigation Header */}
      <header className="border-b border-blue-100/80 bg-white/70 backdrop-blur-xl sticky top-0 z-50 shadow-[0_2px_20px_rgba(59,130,246,0.03)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-12 h-12 rounded-xl overflow-hidden flex items-center justify-center bg-white border border-slate-200 shadow-sm p-0.5">
              <img src="/Logo.png" alt="LeetCode Mentor Logo" className="w-full h-full object-contain" />
            </div>
            <span className="font-extrabold text-lg tracking-tight text-slate-900">LeetCode Mentor</span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
            <a href="#features" className="hover:text-blue-600 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-blue-600 transition-colors">Methodology</a>
            <a href="#comparison" className="hover:text-blue-600 transition-colors">Why Us</a>
          </nav>

          <div className="flex items-center gap-3">
            <button 
              onClick={onSandboxStart}
              className="text-xs sm:text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors px-3 py-2"
            >
              Demo Sandbox
            </button>
            <Button
              onClick={onGetStarted}
              className="shimmer-btn text-white font-bold py-2 px-4 rounded-xl text-xs sm:text-sm shadow-md shadow-blue-500/10 cursor-pointer"
            >
              Sign In
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-24 pb-16 text-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/60 text-blue-600 text-xs font-bold uppercase tracking-wider mb-6 animate-pulse-glow">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Pattern-Based FAANG Prep</span>
        </div>
        
        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-slate-900 leading-[1.1] max-w-4xl mx-auto">
          Stop memorizing solutions.<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-650">Master LeetCode patterns.</span>
        </h1>
        
        <p className="text-slate-600 text-base sm:text-xl mt-6 max-w-2xl mx-auto leading-relaxed">
          LeetCode Mentor converts your practice history into high-fidelity FAANG study guides (LaTeX PDF), maps your weak topic areas, and builds true algorithmic understanding.
        </p>

        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-10">
          <Button
            onClick={onGetStarted}
            className="shimmer-btn w-full sm:w-auto text-white font-bold py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 text-sm shadow-lg shadow-blue-500/20 cursor-pointer"
          >
            Start Preparing Free
            <ArrowRight className="w-4 h-4" />
          </Button>
          <button
            onClick={onSandboxStart}
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl border border-slate-200 hover:border-slate-350 hover:bg-slate-50 transition-all font-bold text-slate-700 text-sm flex items-center justify-center gap-2 cursor-pointer bg-white"
          >
            Enter Sandbox Simulator
          </button>
        </div>
      </section>

      {/* Live Interactive Tabbed Walkthrough */}
      <section id="features" className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="glass-card rounded-3xl border border-blue-100/50 shadow-2xl p-6 sm:p-10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/3 rounded-full blur-3xl pointer-events-none" />
          
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-center">
            {/* Left: Tab selectors */}
            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                How LeetCode Mentor builds understanding
              </h2>
              <p className="text-sm text-slate-500 pb-4">
                Click through the pipeline steps to see how we replace disorganized cramming with structural learning.
              </p>
              
              <div className="space-y-3">
                <button 
                  onClick={() => setActiveTab('input')}
                  className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center gap-4 cursor-pointer ${
                    activeTab === 'input' 
                      ? 'bg-white border-blue-300 shadow-md text-slate-950 font-bold' 
                      : 'bg-transparent border-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                  }`}
                >
                  <div className={`p-2 rounded-xl ${activeTab === 'input' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                    <Terminal className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-slate-450 font-bold">Step 1</p>
                    <p className="text-sm">Log solved problem IDs</p>
                  </div>
                </button>

                <button 
                  onClick={() => setActiveTab('latex')}
                  className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center gap-4 cursor-pointer ${
                    activeTab === 'latex' 
                      ? 'bg-white border-blue-300 shadow-md text-slate-950 font-bold' 
                      : 'bg-transparent border-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                  }`}
                >
                  <div className={`p-2 rounded-xl ${activeTab === 'latex' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                    <Code className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-slate-450 font-bold">Step 2</p>
                    <p className="text-sm">Extract structural patterns</p>
                  </div>
                </button>

                <button 
                  onClick={() => setActiveTab('email')}
                  className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center gap-4 cursor-pointer ${
                    activeTab === 'email' 
                      ? 'bg-white border-blue-300 shadow-md text-slate-950 font-bold' 
                      : 'bg-transparent border-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                  }`}
                >
                  <div className={`p-2 rounded-xl ${activeTab === 'email' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-slate-450 font-bold">Step 3</p>
                    <p className="text-sm">Receive compiled LaTeX PDF</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Right: Mock Display */}
            <div className="lg:col-span-3 bg-slate-900 rounded-2xl border border-slate-850 shadow-2xl p-6 font-mono text-xs text-slate-350 min-h-[300px] flex flex-col justify-between overflow-hidden relative">
              <div className="absolute top-2 right-3 flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              </div>

              {activeTab === 'input' && (
                <div className="space-y-4 pt-2">
                  <p className="text-slate-500">// Log solved questions in dashboard</p>
                  <div className="flex items-center gap-2">
                    <span className="text-blue-400">$</span>
                    <span>leetcode-mentor track --ids 567, 3, 76</span>
                  </div>
                  <div className="space-y-1.5 text-slate-400">
                    <p className="text-emerald-400">✓ Detected LC 567: Permutation in String</p>
                    <p className="text-emerald-400">✓ Detected LC 3: Longest Substring Without Repeating Characters</p>
                    <p className="text-emerald-400">✓ Detected LC 76: Minimum Window Substring</p>
                  </div>
                  <p className="text-blue-400 animate-pulse">// Compiling structural DSA mapping...</p>
                </div>
              )}

              {activeTab === 'latex' && (
                <div className="space-y-3 pt-2 overflow-y-auto max-h-[250px] pr-1">
                  <p className="text-slate-500">// Pattern identified: Sliding Window</p>
                  <p className="text-amber-400 font-bold">DSA Core Pattern Map:</p>
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-850 space-y-1 text-slate-400">
                    <p className="text-white font-bold">Observations:</p>
                    <p>• Window size matches |s1|</p>
                    <p>• Compare character frequency vectors in O(26)</p>
                    <p>• Avoid recalculating frequency: slide window dynamically</p>
                  </div>
                  <div className="text-slate-500 text-[10px]">
                    <span className="text-indigo-400">#include</span> &lt;vector&gt;<br/>
                    <span className="text-indigo-400">bool</span> checkInclusion(string s1, string s2) &#123; <br/>
                    &nbsp;&nbsp;<span className="text-slate-500">// Optimal Sliding Window code mapping...</span><br/>
                    &#125;
                  </div>
                </div>
              )}

              {activeTab === 'email' && (
                <div className="space-y-4 pt-2 flex flex-col justify-between h-full">
                  <div className="space-y-2">
                    <p className="text-slate-500">// Revision Report Compiled & Storage Synced</p>
                    <div className="p-3 bg-blue-950/40 border border-blue-800/40 text-blue-300 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-blue-400" />
                        <div>
                          <p className="text-xs font-bold text-white">revision_guide_2026-06-24.pdf</p>
                          <p className="text-[10px] text-slate-400">Size: 207 KB • Status: Emailed</p>
                        </div>
                      </div>
                      <span className="p-1.5 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700">
                        <Download className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                  <div className="p-3 bg-emerald-950/20 border border-emerald-900/30 text-emerald-400 rounded-lg text-[11px] leading-relaxed">
                    🎉 PDF sent to your inbox. The guide features brute force analyses, optimal solutions with proofs, dynamic variables dry-run tables, and FAANG interview checklists.
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-slate-850/60 text-slate-500 flex justify-between items-center text-[10px]">
                <span>Pipeline Engine: Llama-3.3-Groq</span>
                <span>Active Sandbox mode available</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Methodology Section (The Comparison Matrix) */}
      <section id="how-it-works" className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Memorization vs. Structural Understanding</h2>
          <p className="text-slate-500 text-sm mt-2 max-w-xl mx-auto">
            Why memorizing solutions fails in real interviews, and how pattern mapping solves it.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8" id="comparison">
          {/* Card 1: Old memorization way */}
          <div className="glass-card rounded-2xl border-t-4 border-t-rose-500/80 shadow-md p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl pointer-events-none" />
            <span className="text-[10px] font-bold text-rose-500 uppercase tracking-widest">Standard Memorizing</span>
            <h3 className="text-xl font-bold text-slate-900 mt-1.5 mb-6">Cramming LeetCode Solutions</h3>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 text-xs font-bold shrink-0 mt-0.5">✕</div>
                <p className="text-sm text-slate-600"><strong>Forgets easily:</strong> Memory fades 2–3 weeks after solving, requiring constant re-study.</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 text-xs font-bold shrink-0 mt-0.5">✕</div>
                <p className="text-sm text-slate-600"><strong>Vulnerable to variations:</strong> Slight changes in problem text during the interview cause confusion.</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 text-xs font-bold shrink-0 mt-0.5">✕</div>
                <p className="text-sm text-slate-600"><strong>Messy documentation:</strong> Codes scattered in raw `.cpp` or `.py` files with zero mathematical proofs.</p>
              </div>
            </div>
          </div>

          {/* Card 2: The LeetCode Mentor way */}
          <div className="glass-card rounded-2xl border-t-4 border-t-blue-600 shadow-md p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />
            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">LeetCode Mentor Way</span>
            <h3 className="text-xl font-bold text-slate-900 mt-1.5 mb-6">Pattern Mapping & LaTeX Guides</h3>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                <p className="text-sm text-slate-600"><strong>Structural Retention:</strong> Organizes questions under core DSA schemas for long-term encoding.</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                <p className="text-sm text-slate-600"><strong>Interview-Proofed:</strong> Hand-drawn dry runs and mathematical proofs keep your fundamentals rock solid.</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                <p className="text-sm text-slate-600"><strong>Formatted Archives:</strong> Elegant LaTeX PDF documents sent instantly to your inbox for active recall.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Landing Features Grid */}
      <section className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-slate-200">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Structured Features</h2>
          <p className="text-slate-500 text-sm mt-2">
            No fluff. Just the essential toolset to secure FAANG engineering offers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card rounded-2xl p-6 space-y-4 border border-blue-50/60 shadow-sm hover:scale-[1.01] transition-transform">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
              <Brain className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-900">FAANG DSA Instructors</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Revision PDFs generated using a meticulously designed Google engineer prompt. Explains brute force, optimal trade-offs, and candidate pitfalls.
            </p>
          </div>

          <div className="glass-card rounded-2xl p-6 space-y-4 border border-blue-50/60 shadow-sm hover:scale-[1.01] transition-transform">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
              <Layers className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-900">Weak Area Vectors</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Analyzes topic distributions. Identifies weak conceptual vectors (e.g. Monotonic Stack, Trie) and prompts practice to protect stability.
            </p>
          </div>

          <div className="glass-card rounded-2xl p-6 space-y-4 border border-blue-50/60 shadow-sm hover:scale-[1.01] transition-transform">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
              <FileText className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-900">LaTeX PDF Archival</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Generates LaTeX PDFs and uploads them to Supabase Storage. Cleans up old revisions dynamically to keep database clean and optimal.
            </p>
          </div>
        </div>
      </section>

      {/* Call to Action banner */}
      <section className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center pb-24">
        <div className="glass-card rounded-3xl border border-blue-100/50 shadow-2xl p-10 relative overflow-hidden bg-gradient-to-br from-white to-blue-50/30">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
            Stop Memorizing. Start Understanding.
          </h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto mt-2.5 leading-relaxed">
            Enter the sandbox simulator in 1-click or link your account to compile your first LaTeX daily guide.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-3 mt-8">
            <Button
              onClick={onGetStarted}
              className="shimmer-btn text-white font-bold py-3.5 px-6 rounded-xl text-sm shadow-lg shadow-blue-500/10 cursor-pointer"
            >
              Sign In Free
            </Button>
            <button
              onClick={onSandboxStart}
              className="px-6 py-3.5 rounded-xl border border-slate-205 hover:bg-slate-55 text-slate-700 font-bold text-sm bg-white cursor-pointer"
            >
              Quick Demo Sandbox
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 bg-white/40 py-8 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg overflow-hidden bg-white border border-slate-200 shadow-sm p-0.5">
              <img src="/Logo.png" alt="LeetCode Mentor Logo" className="w-full h-full object-contain" />
            </div>
            <span className="font-bold text-slate-600">LeetCode Mentor © 2026</span>
          </div>
          <div className="flex gap-6">
            <a href="#features" className="hover:underline">Features</a>
            <a href="#how-it-works" className="hover:underline">Methodology</a>
            <button onClick={onGetStarted} className="hover:underline cursor-pointer bg-transparent border-none">Sign In</button>
          </div>
        </div>
      </footer>
    </div>
  );
}
