-- Add interests column to profiles table for volunteers
-- This will store the causes/areas that volunteers are interested in
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS interests text;

-- Add comment to document the column
COMMENT ON COLUMN public.profiles.interests IS 'Comma-separated list of interest areas/causes for volunteers (e.g., "Educação, Saúde, Meio Ambiente")';
