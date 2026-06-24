'use client';

import React, { useState } from 'react';
import { useAuth } from '@/components/auth-provider';
import { useThemeInjector } from '@/lib/theme';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { toast, Toaster } from 'sonner';
import { BookOpen, Sparkles, LogIn, Mail, ArrowLeft } from 'lucide-react';

export default function AuthPage({ 
  onAuthenticated, 
  onBack 
}: { 
  onAuthenticated: () => void; 
  onBack: () => void; 
}) {
  useThemeInjector();
  const { signInMock } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async (isSignUp: boolean) => {
    setLoading(true);
    try {
      let result;
      if (isSignUp) {
        result = await supabase.auth.signUp({ email, password });
      } else {
        result = await supabase.auth.signInWithPassword({ email, password });
      }

      if (result.error) {
        // Fallback to local sandbox profile if Supabase keys are not set up or return error
        console.warn('Supabase Auth error. Redirecting to Sandbox simulation mode.', result.error.message);
        toast.info('Supabase config error. Activating local Sandbox simulation mode.');
        signInMock(email);
        onAuthenticated();
      } else {
        toast.success(isSignUp ? 'Signed up successfully!' : 'Signed in successfully!');
        onAuthenticated();
      }
    } catch (err: any) {
      toast.error('Authentication process failed. Launching Sandbox bypass.');
      signInMock(email);
      onAuthenticated();
    } finally {
      setLoading(false);
    }
  };

  const handleSandbox = () => {
    toast.success('Sandbox profile active. Welcome to LeetCode Mentor!');
    signInMock(email || 'demo-student@leetcode.com');
    onAuthenticated();
  };

  return (
    <div className="relative min-h-screen bg-[#F8FAFC] bg-gradient-to-b from-[#F8FAFC] to-[#EEF2F6] flex flex-col items-center justify-center p-6 text-slate-800 overflow-hidden">
      {/* Back button */}
      <button 
        onClick={onBack}
        className="absolute top-6 left-6 flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors bg-white px-3.5 py-2 rounded-xl border border-slate-200/80 shadow-sm cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Home
      </button>

      {/* Decorative Gradients */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-blue-400/8 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-sky-400/8 blur-[120px] pointer-events-none" />

      <div className="z-10 w-full max-w-md animate-slide-in">
        <div className="text-center mb-8">
          <div className="inline-flex p-1 rounded-3xl bg-white border border-slate-200 shadow-md mb-4 w-24 h-24 items-center justify-center">
            <img src="/Logo.png" alt="LeetCode Mentor Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">LeetCode Mentor</h1>
          <p className="text-slate-500 text-sm mt-2">
            "LeetCode tracks submissions. LeetCode Mentor tracks understanding."
          </p>
        </div>

        <div className="glass-card border border-blue-100/50 shadow-2xl p-6 rounded-3xl relative overflow-hidden bg-white/80">
          <div className="space-y-4">
            <div>
              <h3 className="text-slate-900 font-extrabold text-xl">Get Started</h3>
              <p className="text-slate-455 text-xs mt-1">Sign in with your email or enter sandbox environment instantly.</p>
            </div>

            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Email Address</label>
                <div className="relative rounded-xl bg-slate-50 border border-slate-200 focus-within:ring-2 focus-within:ring-blue-500/25 focus-within:border-blue-500/80 transition-all duration-300">
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-transparent text-slate-800 placeholder-slate-400 focus:outline-none text-sm"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Password</label>
                <div className="relative rounded-xl bg-slate-50 border border-slate-200 focus-within:ring-2 focus-within:ring-blue-500/25 focus-within:border-blue-500/80 transition-all duration-300">
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-transparent text-slate-800 placeholder-slate-400 focus:outline-none text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <Button
                variant="outline"
                className="border-slate-200 bg-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-800 rounded-xl py-2.5 font-semibold cursor-pointer"
                onClick={() => handleAuth(true)}
                disabled={loading}
              >
                Sign Up
              </Button>
              <Button
                className="shimmer-btn text-white font-bold py-2.5 rounded-xl cursor-pointer shadow-md shadow-blue-500/10"
                onClick={() => handleAuth(false)}
                disabled={loading}
              >
                {loading ? 'Processing...' : 'Sign In'}
              </Button>
            </div>

            <div className="flex flex-col space-y-3 border-t border-slate-100 pt-4 mt-4">
              <div className="text-center text-[10px] font-bold text-slate-450 uppercase tracking-widest">Or Quick Start</div>
              <Button
                variant="secondary"
                className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 hover:bg-slate-100/50 text-blue-600 flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm cursor-pointer shadow-sm"
                onClick={handleSandbox}
              >
                <Sparkles className="w-4 h-4 text-amber-505 animate-pulse" />
                Enter Sandbox Simulator
              </Button>
            </div>
          </div>
        </div>
      </div>
      <Toaster theme="light" />
    </div>
  );
}
