import { createClient } from '@supabase/supabase-js';

// Use placeholder credentials to allow successful initialization even if environment variables are not populated yet
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-project.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-key';

// Client for public user-facing interactions
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client for backend bypass rules (e.g. inserting system-wide caches, handling cron schedules)
export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
