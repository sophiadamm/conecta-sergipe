import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export function useUnreadMessages() {
    const { profile } = useAuth();
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        if (!profile) return;

        const fetchUnreadCount = async () => {
            try {
                // Get all conversations for this user
                const { data: conversations } = await supabase
                    .from('conversations')
                    .select('id')
                    .or(`participant_1.eq.${profile.id},participant_2.eq.${profile.id}`);

                if (!conversations || conversations.length === 0) {
                    setUnreadCount(0);
                    return;
                }

                const conversationIds = conversations.map(c => c.id);

                // Count unread messages in all conversations
                const { count } = await supabase
                    .from('messages')
                    .select('*', { count: 'exact', head: true })
                    .in('conversation_id', conversationIds)
                    .eq('read', false)
                    .neq('sender_id', profile.id);

                setUnreadCount(count || 0);
            } catch (error) {
                console.error('Error fetching unread count:', error);
            }
        };

        fetchUnreadCount();

        // Subscribe to new messages
        const channel = supabase
            .channel('unread_messages')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'messages',
                },
                () => {
                    fetchUnreadCount();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [profile]);

    return unreadCount;
}
