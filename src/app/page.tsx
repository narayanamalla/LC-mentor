'use client';

import React, { useState } from 'react';
import { AuthProvider, useAuth } from '@/components/auth-provider';
import AuthPage from '@/components/auth-page';
import Dashboard from '@/components/dashboard';
import LandingPage from '@/components/landing-page';

function AppContent() {
  const { user, loading, signInMock } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleSandboxStart = () => {
    signInMock('sandbox-demo@leetcode-mentor.com');
    setIsAuthenticated(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center text-slate-800">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-slate-500 mt-4 uppercase tracking-wider font-semibold">Booting LeetCode Mentor...</p>
      </div>
    );
  }

  // If already authenticated via Supabase user context or mock profile state
  if (user || isAuthenticated) {
    return <Dashboard />;
  }

  // If auth mode is activated, display Login form page
  if (showAuth) {
    return (
      <AuthPage 
        onAuthenticated={() => setIsAuthenticated(true)} 
        onBack={() => setShowAuth(false)} 
      />
    );
  }

  // Render the premium Landing Page by default
  return (
    <LandingPage 
      onGetStarted={() => setShowAuth(true)} 
      onSandboxStart={handleSandboxStart} 
    />
  );
}

export default function Home() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
