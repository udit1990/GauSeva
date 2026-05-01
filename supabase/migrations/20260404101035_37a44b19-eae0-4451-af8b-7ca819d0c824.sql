
-- Add skills array to volunteer profiles for skill-based task matching
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS skills text[] DEFAULT '{}';
