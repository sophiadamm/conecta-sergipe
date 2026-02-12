-- Fix trigger permission issue by making the function SECURITY DEFINER
-- This allows the trigger to update the conversation timestamp even if the user
-- doesn't have explicit UPDATE permissions on the conversation table (bypassing RLS).

CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.conversations
    SET last_message_at = NEW.created_at,
        updated_at = NEW.created_at
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
