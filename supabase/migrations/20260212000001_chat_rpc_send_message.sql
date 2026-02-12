-- Remote Procedure Call (RPC) to handle sending messages
-- Handles both existing conversations and creating new ones atomically

CREATE OR REPLACE FUNCTION public.send_message(
    p_recipient_id UUID,
    p_content TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_sender_id UUID;
    v_conversation_id UUID;
    v_message_id UUID;
    v_created_at TIMESTAMP WITH TIME ZONE;
BEGIN
    v_sender_id := auth.uid();
    
    IF v_sender_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- 1. Check if conversation exists (bidirectional check)
    SELECT id INTO v_conversation_id
    FROM conversations
    WHERE (participant_1 = v_sender_id AND participant_2 = p_recipient_id)
       OR (participant_1 = p_recipient_id AND participant_2 = v_sender_id)
    LIMIT 1;

    -- 2. If not exists, create new one
    IF v_conversation_id IS NULL THEN
        INSERT INTO conversations (participant_1, participant_2)
        VALUES (v_sender_id, p_recipient_id)
        RETURNING id INTO v_conversation_id;
    END IF;

    -- 3. Insert message
    INSERT INTO messages (conversation_id, sender_id, content)
    VALUES (v_conversation_id, v_sender_id, p_content)
    RETURNING id, created_at INTO v_message_id, v_created_at;

    -- Return the new IDs and timestamp
    RETURN jsonb_build_object(
        'conversation_id', v_conversation_id,
        'message_id', v_message_id,
        'created_at', v_created_at
    );
END;
$$;
