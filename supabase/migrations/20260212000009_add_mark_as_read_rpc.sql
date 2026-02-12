-- Add Unread Count System
-- This migration adds the RPC function to mark messages as read

-- Function to mark messages as read for a specific conversation
CREATE OR REPLACE FUNCTION public.mark_messages_as_read(
    p_conversation_id UUID
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_profile_id UUID;
BEGIN
    -- Get the profile ID for the authenticated user
    SELECT id INTO v_user_profile_id
    FROM profiles
    WHERE user_id = auth.uid();

    IF v_user_profile_id IS NULL THEN
        RAISE EXCEPTION 'Profile not found for authenticated user';
    END IF;

    -- Mark all messages in this conversation as read
    -- where the current user is NOT the sender
    UPDATE messages
    SET read = true
    WHERE conversation_id = p_conversation_id
    AND sender_id != v_user_profile_id
    AND read = false;
END;
$$;
