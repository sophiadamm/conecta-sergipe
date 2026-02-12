-- Fix RLS policy for constructing conversations
-- The previous error (42501) indicates that the user cannot INSERT into the conversations table.

-- 1. Ensure RLS is enabled
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to avoid conflicts or stale definitions
DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;

-- 3. Create a robust INSERT policy
-- This allows any authenticated user to create a conversation where they are one of the participants.
CREATE POLICY "Users can create conversations"
    ON public.conversations FOR INSERT
    WITH CHECK (
        auth.uid() = participant_1 OR 
        auth.uid() = participant_2
    );

-- 4. Ensure implicit permissions are granted
GRANT ALL ON public.conversations TO authenticated;
GRANT ALL ON public.conversations TO service_role;
