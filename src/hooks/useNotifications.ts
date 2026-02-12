import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from './use-toast';

export interface Notification {
    id: string;
    user_id: string;
    title: string;
    message: string;
    type: string;
    link: string;
    is_read: boolean;
    created_at: string;
}

export function useNotifications() {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);

    // Buscar notificações do usuário
    const fetchNotifications = async () => {
        if (!user) {
            setNotifications([]);
            setUnreadCount(0);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);

            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(20);

            if (error) throw error;

            setNotifications(data || []);
            setUnreadCount((data || []).filter(n => !n.is_read).length);
        } catch (error) {
            console.error('Erro ao buscar notificações:', error);
            toast({
                title: 'Erro',
                description: 'Não foi possível carregar as notificações.',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    // Marcar uma notificação como lida
    const markAsRead = async (notificationId: string) => {
        try {
            const { error } = await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('id', notificationId);

            if (error) throw error;

            // Atualizar estado local
            setNotifications(prev =>
                prev.map(n =>
                    n.id === notificationId ? { ...n, is_read: true } : n
                )
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Erro ao marcar notificação como lida:', error);
        }
    };

    // Marcar todas como lidas
    const markAllAsRead = async () => {
        if (!user) return;

        try {
            const { error } = await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('user_id', user.id)
                .eq('is_read', false);

            if (error) throw error;

            // Atualizar estado local
            setNotifications(prev =>
                prev.map(n => ({ ...n, is_read: true }))
            );
            setUnreadCount(0);

            toast({
                title: 'Sucesso',
                description: 'Todas as notificações foram marcadas como lidas.',
            });
        } catch (error) {
            console.error('Erro ao marcar todas como lidas:', error);
            toast({
                title: 'Erro',
                description: 'Não foi possível marcar todas como lidas.',
                variant: 'destructive',
            });
        }
    };

    // Deletar uma notificação
    const deleteNotification = async (notificationId: string) => {
        try {
            const { error } = await supabase
                .from('notifications')
                .delete()
                .eq('id', notificationId);

            if (error) throw error;

            // Atualizar estado local
            const notification = notifications.find(n => n.id === notificationId);
            setNotifications(prev => prev.filter(n => n.id !== notificationId));

            if (notification && !notification.is_read) {
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (error) {
            console.error('Erro ao deletar notificação:', error);
            toast({
                title: 'Erro',
                description: 'Não foi possível deletar a notificação.',
                variant: 'destructive',
            });
        }
    };

    // Carregar notificações ao montar e quando usuário mudar
    useEffect(() => {
        fetchNotifications();
    }, [user?.id]);

    // Subscrever a mudanças em tempo real
    useEffect(() => {
        if (!user) return;

        const channel = supabase
            .channel('notifications-channel')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${user.id}`,
                },
                (payload) => {
                    console.log('Mudança nas notificações:', payload);

                    if (payload.eventType === 'INSERT') {
                        const newNotification = payload.new as Notification;
                        setNotifications(prev => [newNotification, ...prev]);
                        setUnreadCount(prev => prev + 1);

                        // Toast para nova notificação
                        toast({
                            title: newNotification.title,
                            description: newNotification.message,
                        });
                    } else if (payload.eventType === 'UPDATE') {
                        const updatedNotification = payload.new as Notification;
                        setNotifications(prev =>
                            prev.map(n =>
                                n.id === updatedNotification.id ? updatedNotification : n
                            )
                        );
                    } else if (payload.eventType === 'DELETE') {
                        const deletedId = payload.old.id;
                        setNotifications(prev => prev.filter(n => n.id !== deletedId));
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user?.id]);

    return {
        notifications,
        unreadCount,
        loading,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        refresh: fetchNotifications,
    };
}
