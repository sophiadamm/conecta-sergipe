-- Reset Chat RLS Policies
-- This migration drops ALL existing policies on conversations and messages to ensure a clean slate.
-- It then re-creates the necessary policies with simplified logic.

-- 1. Disable RLS momentarily to ensure no interference during policy drops
ALTER TABLE public.conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages DISABLE ROW LEVEL SECURITY;

-- 2. Drop ALL existing policies for 'conversations'
DROP POLICY IF EXISTS "Users can view their own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can update their own conversations" ON public.conversations;
-- (In case there are others with different names)
DROP POLICY IF EXISTS "Enable read access for all users" ON public.conversations;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.conversations;

-- 3. Drop ALL existing policies for 'messages'
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages in their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON public.messages;

-- 4. Re-enable RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 5. Re-create Simple Policies for CONVERSATIONS
-- SELECT: Users can see conversations they are part of
CREATE POLICY "conversations_select_policy"
    ON public.conversations FOR SELECT
    USING (auth.uid() = participant_1 OR auth.uid() = participant_2);

-- INSERT: Users can create conversations if they are one of the participants
CREATE POLICY "conversations_insert_policy"
    ON public.conversations FOR INSERT
    WITH CHECK (auth.uid() = participant_1 OR auth.uid() = participant_2);

-- UPDATE: Users can update conversations they are part of (e.g., read status, last message)
CREATE POLICY "conversations_update_policy"
    ON public.conversations FOR UPDATE
    USING (auth.uid() = participant_1 OR auth.uid() = participant_2);

-- 6. Re-create Simple Policies for MESSAGES
-- SELECT: Users can see messages in conversations they belong to
CREATE POLICY "messages_select_policy"
    ON public.messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.conversations
            WHERE conversations.id = messages.conversation_id
            AND (conversations.participant_1 = auth.uid() OR conversations.participant_2 = auth.uid())
        )
    );

-- INSERT: Users can send messages to conversations they belong to as themselves
CREATE POLICY "messages_insert_policy"
    ON public.messages FOR INSERT
    WITH CHECK (
        auth.uid() = sender_id
        AND EXISTS (
            SELECT 1 FROM public.conversations
            WHERE conversations.id = conversation_id
            AND (conversations.participant_1 = auth.uid() OR conversations.participant_2 = auth.uid())
        )
    );

-- UPDATE: Users can update their own messages (optional, but good for edits)
CREATE POLICY "messages_update_policy"
    ON public.messages FOR UPDATE
    USING (auth.uid() = sender_id);

-- 7. Grant permissions
GRANT ALL ON public.conversations TO authenticated;
GRANT ALL ON public.conversations TO service_role;
GRANT ALL ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
