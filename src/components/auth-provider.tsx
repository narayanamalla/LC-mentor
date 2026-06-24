'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInMock: (email: string) => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signInMock: () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Check if there is a saved mock user first
    const savedMock = localStorage.getItem('leetcode_mentor_mock_user');
    if (savedMock) {
      try {
        const parsed = JSON.parse(savedMock);
        if (parsed && parsed.id) {
          setUser(parsed);
          setLoading(false);
          return;
        }
      } catch (e) {
        console.error('Failed to parse saved mock user:', e);
      }
    }

    // 2. Check Supabase session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
      } else if (!localStorage.getItem('leetcode_mentor_mock_user')) {
        setUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInMock = (email: string) => {
    // Helper to simulate authentication bypass if Supabase project keys are unconfigured
    const mockUser: User = {
      id: '00000000-0000-0000-0000-000000000000',
      app_metadata: {},
      user_metadata: {},
      aud: 'authenticated',
      created_at: new Date().toISOString(),
      email: email || 'narayanamalla0008@gmail.com',
    };
    setUser(mockUser);
    localStorage.setItem('leetcode_mentor_mock_user', JSON.stringify(mockUser));
    setLoading(false);
  };

  const signOut = async () => {
    localStorage.removeItem('leetcode_mentor_mock_user');
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInMock, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
