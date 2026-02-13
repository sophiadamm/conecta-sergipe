-- Add certificate_issued_at column to matches table
ALTER TABLE public.matches 
ADD COLUMN IF NOT EXISTS certificate_issued_at TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN public.matches.certificate_issued_at IS 'Timestamp when the volunteer certificate was issued. NULL means not issued yet.';
