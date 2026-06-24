-- Create Users table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  leetcode_username TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Problems table (known LeetCode problems)
CREATE TABLE IF NOT EXISTS public.problems (
  id BIGINT PRIMARY KEY, -- Problem ID (e.g. 560)
  title TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  topics TEXT[] NOT NULL DEFAULT '{}'::TEXT[]
);

-- Create Solved Problems table
CREATE TABLE IF NOT EXISTS public.solved_problems (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  problem_id BIGINT REFERENCES public.problems(id) ON DELETE CASCADE NOT NULL,
  solved_date DATE DEFAULT CURRENT_DATE NOT NULL,
  UNIQUE(user_id, problem_id, solved_date)
);

-- Create Topic Notes table
CREATE TABLE IF NOT EXISTS public.topic_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  topic TEXT NOT NULL,
  latex_content TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(topic)
);

-- Create Reports table
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  report_date DATE DEFAULT CURRENT_DATE NOT NULL,
  pdf_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, report_date)
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.solved_problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topic_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Create Policies
-- Users policy: Users can select/insert/update their own profile
CREATE POLICY "Allow users access to their own profile" ON public.users
  FOR ALL USING (auth.uid() = id);

-- Problems policy: Allow public read
CREATE POLICY "Allow public read access to problems" ON public.problems
  FOR SELECT TO public USING (true);

-- Problems policy: Allow service role to write
CREATE POLICY "Allow service role to modify problems" ON public.problems
  FOR ALL USING (true) WITH CHECK (true);

-- Solved Problems policy: Users can see/edit their own solved problems
CREATE POLICY "Allow users access to their own solved problems" ON public.solved_problems
  FOR ALL USING (auth.uid() = user_id);

-- Topic Notes policy: Anyone authenticated can read, service role can modify
CREATE POLICY "Allow read access to topic notes" ON public.topic_notes
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow service role to modify topic notes" ON public.topic_notes
  FOR ALL USING (true) WITH CHECK (true);

-- Reports policy: Users can read their own reports
CREATE POLICY "Allow users access to their own reports" ON public.reports
  FOR ALL USING (auth.uid() = user_id);

-- User trigger on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, leetcode_username)
  VALUES (new.id, new.email, '');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Seed some standard problems to make the app work out of the box
INSERT INTO public.problems (id, title, difficulty, topics) VALUES
  (1, 'Two Sum', 'Easy', ARRAY['Hash Table', 'Array']),
  (15, '3Sum', 'Medium', ARRAY['Two Pointers', 'Sorting', 'Array']),
  (560, 'Subarray Sum Equals K', 'Medium', ARRAY['Prefix Sum', 'Hash Table', 'Array']),
  (76, 'Minimum Window Substring', 'Hard', ARRAY['Sliding Window', 'Hash Table', 'String']),
  (239, 'Sliding Window Maximum', 'Hard', ARRAY['Sliding Window', 'Heap', 'Monotonic Queue']),
  (3, 'Longest Substring Without Repeating Characters', 'Medium', ARRAY['Sliding Window', 'Hash Table', 'String']),
  (704, 'Binary Search', 'Easy', ARRAY['Binary Search', 'Array']),
  (33, 'Search in Rotated Sorted Array', 'Medium', ARRAY['Binary Search', 'Array']),
  (200, 'Number of Islands', 'Medium', ARRAY['Graphs', 'DFS', 'BFS']),
  (70, 'Climbing Stairs', 'Easy', ARRAY['Dynamic Programming']),
  (322, 'Coin Change', 'Medium', ARRAY['Dynamic Programming', 'BFS'])
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  difficulty = EXCLUDED.difficulty,
  topics = EXCLUDED.topics;
