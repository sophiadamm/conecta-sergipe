-- Add UPDATE policy for conversations table
-- This is required because the trigger 'update_conversation_timestamp' runs on message insert
-- and attempts to update the 'updated_at' and 'last_message_at' fields of the conversation.
-- Without this policy, likely the trigger fails (if not SECURITY DEFINER) or the RLS blocks it.

CREATE POLICY "Users can update their own conversations"
    ON public.conversations FOR UPDATE
    USING (auth.uid() = participant_1 OR auth.uid() = participant_2)
    WITH CHECK (auth.uid() = participant_1 OR auth.uid() = participant_2);
