import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { Search, Send, ArrowLeft, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate, useSearchParams } from 'react-router-dom';

interface Profile {
    id: string;
    nome: string;
    avatar_url: string | null;
    tipo: 'voluntario' | 'ong';
}

interface Message {
    id: string;
    conversation_id: string;
    sender_id: string;
    content: string;
    read: boolean;
    created_at: string;
}

interface Conversation {
    id: string;
    participant_1: string;
    participant_2: string;
    last_message_at: string;
    otherUser: Profile;
    lastMessage?: Message;
    unreadCount: number;
}

export default function Chat() {
    const { profile } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [startingChat, setStartingChat] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [showMobileConversation, setShowMobileConversation] = useState(false);

    useEffect(() => {
        if (profile) {
            loadConversations();
            subscribeToMessages();
        }
    }, [profile]);

    // Handle deep linking (newChatWith, receiverId, etc.)
    useEffect(() => {
        const handleDeepLink = async () => {
            // Priority: newChatWith -> receiverId -> userId -> ngoId
            const targetId = searchParams.get('newChatWith') ||
                searchParams.get('receiverId') ||
                searchParams.get('userId') ||
                searchParams.get('ngoId');

            if (!targetId || !profile) return;

            // Wait for conversations to load
            if (loading) return;

            // 1. Check if conversation already exists in loaded conversations
            const existingConversation = conversations.find(
                c => c.otherUser.id === targetId
            );

            if (existingConversation) {
                // Determine if we should switch (only if not already selected)
                if (selectedConversation?.id !== existingConversation.id) {
                    setSelectedConversation(existingConversation);
                    setShowMobileConversation(true);
                }
            } else {
                // 2. New contact - Initialize temporary chat
                await initializeTemporaryChat(targetId);
            }

            // Cleanup URL params without reloading page
            if (window.location.search) {
                const newUrl = window.location.pathname;
                window.history.replaceState({}, '', newUrl);
            }
        };

        handleDeepLink();
    }, [conversations, profile, loading, searchParams]);

    useEffect(() => {
        if (selectedConversation) {
            if (selectedConversation.id !== 'temp') {
                loadMessages(selectedConversation.id);
                markMessagesAsRead(selectedConversation.id);
            } else {
                setMessages([]); // Empty messages for new temporary chat
            }
        }
    }, [selectedConversation]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const loadConversations = async () => {
        if (!profile) return;

        try {
            const { data: convos, error } = await supabase
                .from('conversations')
                .select('*')
                .or(`participant_1.eq.${profile.id},participant_2.eq.${profile.id}`)
                .order('last_message_at', { ascending: false });

            if (error) throw error;

            // Load other user profiles and last messages
            const conversationsWithData = await Promise.all(
                (convos || []).map(async (convo) => {
                    const otherUserId = convo.participant_1 === profile.id
                        ? convo.participant_2
                        : convo.participant_1;

                    const { data: otherUser } = await supabase
                        .from('profiles')
                        .select('id, nome, avatar_url, tipo')
                        .eq('id', otherUserId)
                        .single();

                    const { data: lastMsg } = await supabase
                        .from('messages')
                        .select('*')
                        .eq('conversation_id', convo.id)
                        .order('created_at', { ascending: false })
                        .limit(1)
                        .single();

                    const { count: unreadCount } = await supabase
                        .from('messages')
                        .select('*', { count: 'exact', head: true })
                        .eq('conversation_id', convo.id)
                        .eq('read', false)
                        .neq('sender_id', profile.id);

                    return {
                        ...convo,
                        otherUser: otherUser as Profile,
                        lastMessage: lastMsg as Message,
                        unreadCount: unreadCount || 0,
                    };
                })
            );

            setConversations(conversationsWithData);
        } catch (error) {
            console.error('Error loading conversations:', error);
            toast({
                title: 'Erro ao carregar conversas',
                description: 'Tente novamente mais tarde.',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const loadMessages = async (conversationId: string) => {
        try {
            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .eq('conversation_id', conversationId)
                .order('created_at', { ascending: true });

            if (error) throw error;
            setMessages(data || []);
        } catch (error) {
            console.error('Error loading messages:', error);
        }
    };

    const markMessagesAsRead = async (conversationId: string) => {
        if (!profile) return;

        // Use RPC for better performance and consistency
        const { error } = await supabase.rpc('mark_messages_as_read' as any, {
            p_conversation_id: conversationId
        });

        if (error) {
            console.error('Error marking messages as read:', error);
            return;
        }

        // Update local state - zero out unread count for this conversation
        setConversations(prev =>
            prev.map(c =>
                c.id === conversationId ? { ...c, unreadCount: 0 } : c
            )
        );
    };

    const subscribeToMessages = () => {
        if (!profile) return;

        const channel = supabase
            .channel('messages')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                },
                (payload) => {
                    const newMsg = payload.new as Message;

                    // Update messages if in active conversation
                    // For temp conversation, we will handle it after creation
                    if (selectedConversation?.id === newMsg.conversation_id && selectedConversation.id !== 'temp') {
                        setMessages(prev => [...prev, newMsg]);
                        markMessagesAsRead(newMsg.conversation_id);
                    }

                    // Reload conversations to update preview
                    loadConversations();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    };

    const initializeTemporaryChat = async (targetId: string) => {
        if (startingChat || !profile) return;
        setStartingChat(true);

        try {
            // Fetch target user profile
            const { data: contactProfile, error } = await supabase
                .from('profiles')
                .select('id, nome, avatar_url, tipo')
                .eq('id', targetId)
                .single();

            if (error || !contactProfile) {
                console.error('Profile not found:', error);
                toast({
                    title: 'Usuário não encontrado',
                    variant: 'destructive',
                });
                return;
            }

            // Create temporary conversation object
            const tempConversation: Conversation = {
                id: 'temp',
                participant_1: profile.id,
                participant_2: targetId,
                last_message_at: new Date().toISOString(),
                otherUser: {
                    id: contactProfile.id,
                    nome: contactProfile.nome,
                    avatar_url: contactProfile.avatar_url,
                    tipo: contactProfile.tipo as 'voluntario' | 'ong',
                },
                unreadCount: 0,
            };

            setSelectedConversation(tempConversation);
            setShowMobileConversation(true);

        } catch (error) {
            console.error('Error initializing chat:', error);
        } finally {
            setStartingChat(false);
        }
    };

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        const messageContent = newMessage.trim();
        if (!messageContent || !selectedConversation || !profile) return;

        const tempId = `temp-${Date.now()}`;
        const recipientId = selectedConversation.otherUser.id;

        // Optimistic Update
        const optimisticMessage: Message = {
            id: tempId,
            conversation_id: selectedConversation.id,
            sender_id: profile.id,
            content: messageContent,
            read: false,
            created_at: new Date().toISOString(),
        };

        setMessages(prev => [...prev, optimisticMessage]);
        setNewMessage('');
        setSending(true);

        try {
            // Use Secure RPC to send message (Bypasses RLS issues)
            const { data, error } = await supabase.rpc('send_message_secure' as any, {
                p_recipient_id: recipientId,
                p_content: messageContent,
            });

            if (error) throw error;

            const response = data as any;
            const newConversationId = response.conversation_id;
            const newMessageId = response.message_id;
            const newMessageCreatedAt = response.created_at;

            const realMessage: Message = {
                id: newMessageId,
                conversation_id: newConversationId,
                sender_id: profile.id,
                content: messageContent,
                read: false,
                created_at: newMessageCreatedAt
            };

            // 3. Update State with Real Data
            setMessages(prev => prev.map(msg =>
                msg.id === tempId ? realMessage : msg
            ));

            // If it was a temporary conversation, update it to real
            if (selectedConversation.id === 'temp') {
                const updatedConversation = {
                    ...selectedConversation,
                    id: newConversationId,
                    last_message_at: newMessageCreatedAt,
                    lastMessage: realMessage
                };

                setSelectedConversation(updatedConversation);

                // Add to conversations list immediately
                setConversations(prev => [updatedConversation, ...prev]);
            } else {
                // Update existing conversation in list
                setConversations(prev => {
                    const filtered = prev.filter(c => c.id !== newConversationId); // Ensure we use new ID if it changed
                    const updated = {
                        ...selectedConversation,
                        id: newConversationId, // Ensure ID is correct
                        last_message_at: newMessageCreatedAt,
                        lastMessage: realMessage
                    };
                    return [updated, ...filtered];
                });
            }

        } catch (error: any) {
            console.error('Error sending message:', error);
            // Revert optimistic update
            setMessages(prev => prev.filter(msg => msg.id !== tempId));
            setNewMessage(messageContent); // Put text back
            toast({
                title: 'Erro ao enviar mensagem',
                description: error.message || error.details || 'Ocorreu um erro desconhecido.',
                variant: 'destructive',
            });
        } finally {
            setSending(false);
        }
    };

    const filteredConversations = conversations.filter(c =>
        c.otherUser?.nome?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const formatMessageTime = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

        if (diffInHours < 24) {
            return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        } else {
            return formatDistanceToNow(date, { addSuffix: true, locale: ptBR });
        }
    };

    if (!profile) {
        return null;
    }

    return (
        <div className="min-h-screen bg-background">
            <Header />

            <div className="h-[calc(100vh-4rem)] flex">
                {/* Sidebar - Conversations List */}
                <div className={`
                    ${showMobileConversation ? 'hidden md:flex' : 'flex'}
                    w-full md:w-[380px] border-r flex-col bg-card
                `}>
                    {/* Header */}
                    <div className="p-4 border-b">
                        <div className="flex items-center gap-3 mb-4">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate(-1)}
                                className="gap-2"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                <span className="hidden sm:inline">Voltar</span>
                            </Button>
                            <h2 className="text-xl font-bold flex-1">Minhas Conversas</h2>
                        </div>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar contato..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </div>

                    {/* Conversations List */}
                    <div className="flex-1 overflow-y-auto">
                        {loading ? (
                            <div className="p-4 space-y-4">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="flex items-center gap-3">
                                        <Skeleton className="h-12 w-12 rounded-full" />
                                        <div className="flex-1">
                                            <Skeleton className="h-4 w-32 mb-2" />
                                            <Skeleton className="h-3 w-48" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : filteredConversations.length === 0 ? (
                            <div className="p-8 text-center text-muted-foreground">
                                <p>Nenhuma conversa encontrada</p>
                            </div>
                        ) : (
                            filteredConversations.map(conversation => (
                                <button
                                    key={conversation.id}
                                    onClick={() => {
                                        setSelectedConversation(conversation);
                                        setShowMobileConversation(true);
                                    }}
                                    className={`
                                        w-full p-4 flex items-start gap-3 hover:bg-accent transition-colors
                                        ${selectedConversation?.id === conversation.id ? 'bg-accent' : ''}
                                        border-b
                                    `}
                                >
                                    <Avatar className="h-12 w-12">
                                        {conversation.otherUser?.avatar_url && (
                                            <AvatarImage src={conversation.otherUser.avatar_url} />
                                        )}
                                        <AvatarFallback className="bg-primary/10 text-primary">
                                            {conversation.otherUser?.nome?.charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>

                                    <div className="flex-1 min-w-0 text-left">
                                        <div className="flex items-center justify-between mb-1">
                                            <p className={`font-semibold truncate ${conversation.unreadCount > 0 ? 'text-foreground' : ''}`}>
                                                {conversation.otherUser?.nome}
                                            </p>
                                            <span className="text-xs text-muted-foreground ml-2 flex-shrink-0">
                                                {conversation.lastMessage && formatMessageTime(conversation.lastMessage.created_at)}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <p className={`text-sm truncate flex-1 ${conversation.unreadCount > 0 ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
                                                {conversation.lastMessage?.content || 'Sem mensagens'}
                                            </p>
                                            {conversation.unreadCount > 0 && (
                                                <Badge variant="default" className="h-5 min-w-[20px] flex items-center justify-center px-1.5">
                                                    {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Main Chat Area */}
                <div className={`
                    ${showMobileConversation ? 'flex' : 'hidden md:flex'}
                    flex-1 flex-col bg-background
                `}>
                    {selectedConversation ? (
                        <>
                            {/* Chat Header */}
                            <div className="p-4 border-b flex items-center gap-3 bg-card">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="md:hidden"
                                    onClick={() => setShowMobileConversation(false)}
                                >
                                    <ArrowLeft className="h-5 w-5" />
                                </Button>

                                <Avatar className="h-10 w-10">
                                    {selectedConversation.otherUser?.avatar_url && (
                                        <AvatarImage src={selectedConversation.otherUser.avatar_url} />
                                    )}
                                    <AvatarFallback className="bg-primary/10 text-primary">
                                        {selectedConversation.otherUser?.nome?.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>

                                <div className="flex-1">
                                    <p className="font-semibold">{selectedConversation.otherUser?.nome}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {selectedConversation.otherUser?.tipo === 'ong' ? 'Organização' : 'Voluntário'}
                                    </p>
                                </div>

                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => navigate(`/perfil/${selectedConversation.otherUser.id}`)}
                                >
                                    <User className="h-4 w-4 mr-2" />
                                    Ver Perfil
                                </Button>
                            </div>

                            {/* Messages Area */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                {messages.map((message) => {
                                    const isMyMessage = message.sender_id === profile.id;
                                    return (
                                        <div
                                            key={message.id}
                                            className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div className={`max-w-[70%] ${isMyMessage ? 'order-2' : 'order-1'}`}>
                                                <div
                                                    className={`
                                                        rounded-2xl px-4 py-2
                                                        ${isMyMessage
                                                            ? 'bg-primary text-primary-foreground rounded-br-sm'
                                                            : 'bg-muted text-foreground rounded-bl-sm'
                                                        }
                                                    `}
                                                >
                                                    <p className="whitespace-pre-wrap break-words">{message.content}</p>
                                                </div>
                                                <p className={`text-xs text-muted-foreground mt-1 ${isMyMessage ? 'text-right' : 'text-left'}`}>
                                                    {formatMessageTime(message.created_at)}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Message Input */}
                            <form onSubmit={sendMessage} className="p-4 border-t bg-card">
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Digite sua mensagem..."
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                sendMessage(e);
                                            }
                                        }}
                                        className="flex-1"
                                        disabled={sending}
                                    />
                                    <Button type="submit" disabled={sending || !newMessage.trim()} size="icon">
                                        <Send className="h-4 w-4" />
                                    </Button>
                                </div>
                            </form>
                        </>
                    ) : startingChat ? (
                        /* Loading State - Starting Conversation */
                        <div className="flex-1 flex items-center justify-center p-8">
                            <div className="text-center max-w-sm space-y-4">
                                <Skeleton className="mx-auto h-16 w-16 rounded-full" />
                                <Skeleton className="h-6 w-48 mx-auto" />
                                <Skeleton className="h-4 w-64 mx-auto" />
                                <p className="text-sm text-muted-foreground mt-4">
                                    Iniciando troca de mensagens...
                                </p>
                            </div>
                        </div>
                    ) : (
                        /* Empty State */
                        <div className="flex-1 flex items-center justify-center p-8">
                            <div className="text-center max-w-sm">
                                <div className="mx-auto w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                                    <Send className="h-12 w-12 text-primary" />
                                </div>
                                <h3 className="text-xl font-semibold mb-2">Selecione uma conversa</h3>
                                <p className="text-muted-foreground">
                                    Escolha uma conversa da lista para começar a trocar mensagens
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
