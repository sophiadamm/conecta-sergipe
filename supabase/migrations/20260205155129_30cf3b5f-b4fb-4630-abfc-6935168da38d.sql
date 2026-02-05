-- Add new columns to profiles table for enhanced profile features
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
ADD COLUMN IF NOT EXISTS github_url TEXT,
ADD COLUMN IF NOT EXISTS experience_level TEXT DEFAULT 'iniciante';

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.linkedin_url IS 'LinkedIn profile URL for volunteers';
COMMENT ON COLUMN public.profiles.github_url IS 'GitHub profile URL for volunteers';
COMMENT ON COLUMN public.profiles.experience_level IS 'Experience level: iniciante, junior, senior';