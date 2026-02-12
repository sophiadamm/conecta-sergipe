-- Fix Chat RLS - Profile ID Mismatch
-- The previous policies compared auth.uid() (User ID) directly with participant_1 (Profile ID).
-- This migration updates the policies to join with the profiles table to resolve the correct Profile ID.

-- 1. Disable RLS momentarily
ALTER TABLE public.conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages DISABLE ROW LEVEL SECURITY;

-- 2. Drop existing broken policies
DROP POLICY IF EXISTS "conversations_select_policy" ON public.conversations;
DROP POLICY IF EXISTS "conversations_insert_policy" ON public.conversations;
DROP POLICY IF EXISTS "conversations_update_policy" ON public.conversations;
DROP POLICY IF EXISTS "messages_select_policy" ON public.messages;
DROP POLICY IF EXISTS "messages_insert_policy" ON public.messages;
DROP POLICY IF EXISTS "messages_update_policy" ON public.messages;

-- 3. Re-enable RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 4. Correct Policies for CONVERSATIONS
-- SELECT: Users can see conversations where they are a participant (via Profile ID)
CREATE POLICY "conversations_select_policy"
    ON public.conversations FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE user_id = auth.uid()
            AND (id = participant_1 OR id = participant_2)
        )
    );

-- INSERT: (Handled mostly by RPC now, but good to have correct policy)
CREATE POLICY "conversations_insert_policy"
    ON public.conversations FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE user_id = auth.uid()
            AND (id = participant_1 OR id = participant_2)
        )
    );

-- UPDATE: Users can update conversations they are part of
CREATE POLICY "conversations_update_policy"
    ON public.conversations FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE user_id = auth.uid()
            AND (id = participant_1 OR id = participant_2)
        )
    );

-- 5. Correct Policies for MESSAGES
-- SELECT: Users can see messages in conversations they belong to
CREATE POLICY "messages_select_policy"
    ON public.messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.conversations c
            JOIN public.profiles p ON p.user_id = auth.uid()
            WHERE c.id = messages.conversation_id
            AND (c.participant_1 = p.id OR c.participant_2 = p.id)
        )
    );

-- INSERT: (Handled mostly by RPC now)
CREATE POLICY "messages_insert_policy"
    ON public.messages FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.user_id = auth.uid()
            AND p.id = sender_id
        )
        AND
        EXISTS (
            SELECT 1 FROM public.conversations c
            JOIN public.profiles p ON p.user_id = auth.uid()
            WHERE c.id = conversation_id
            AND (c.participant_1 = p.id OR c.participant_2 = p.id)
        )
    );

-- UPDATE: Users can update their own messages
CREATE POLICY "messages_update_policy"
    ON public.messages FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.user_id = auth.uid()
            AND p.id = sender_id
        )
    );

-- 6. Grant permissions
GRANT ALL ON public.conversations TO authenticated;
GRANT ALL ON public.conversations TO service_role;
GRANT ALL ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
