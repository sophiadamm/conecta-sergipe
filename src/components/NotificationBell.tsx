import { Bell, Check, CheckCheck, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { useNotifications } from '@/hooks/useNotifications';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useState } from 'react';

export function NotificationBell() {
    const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification, loading } = useNotifications();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);

    const handleNotificationClick = async (notificationId: string) => {
        await markAsRead(notificationId);
        // Não fechamos mais o popover automaticamente para permitir interação contínua se o usuário quiser ler várias
        // Mas se o objetivo for apenas marcar como lida e não navegar, talvez nem precise fechar?
        // O user pediu: "O usuário clica na notificação, ela é marcada como lida... mas ele permanece na mesma página"
        // Vou manter setOpen(false)?
        // Se eu não fechar, ele pode clicar em várias.
        // Se eu fechar, parece que a notificação "fez algo".
        // O user não especificou sobre fechar o popover. O padrão geralmente é NÃO fechar se não navegar.
        // Vou optar por NÃO fechar o popover ao clicar, apenas marcar como lida e atualizar o visual.
        // Isso dá um feedback melhor de "li isso".
        // Mas espere... se eu clico, ela marca como lida e muda o estilo. O popover fica aberto. Isso é bom.
    };

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'application_approved':
                return '🎉';
            case 'application_rejected':
                return '📋';
            case 'new_candidacy':
                return '👋';
            case 'volunteer_reviewed':
            case 'ong_reviewed':
                return '⭐';
            default:
                return '🔔';
        }
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative h-10 w-10 rounded-full"
                    aria-label="Notificações"
                >
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-lg animate-in zoom-in-50">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </Button>
            </PopoverTrigger>

            <PopoverContent className="w-[380px] p-0" align="end">
                {/* Header */}
                <div className="flex items-center justify-between border-b px-4 py-3 bg-muted/30">
                    <div>
                        <h3 className="font-semibold text-sm">Notificações</h3>
                        {unreadCount > 0 && (
                            <p className="text-xs text-muted-foreground">
                                {unreadCount} {unreadCount === 1 ? 'nova' : 'novas'}
                            </p>
                        )}
                    </div>
                    {notifications.length > 0 && (
                        <div className="flex items-center gap-1">
                            {unreadCount > 0 && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={markAllAsRead}
                                    className="h-8 gap-1 text-xs"
                                >
                                    <CheckCheck className="h-3.5 w-3.5" />
                                    Marcar todas
                                </Button>
                            )}
                        </div>
                    )}
                </div>

                {/* Notificações */}
                <ScrollArea className="h-[380px]">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                                <p className="text-sm">Carregando...</p>
                            </div>
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 px-4">
                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted/50 mb-3">
                                <Bell className="h-8 w-8 text-muted-foreground/50" />
                            </div>
                            <p className="text-sm font-medium text-muted-foreground">
                                Nenhuma notificação
                            </p>
                            <p className="text-xs text-muted-foreground/80 text-center mt-1">
                                Você será notificado sobre novidades aqui
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={cn(
                                        "group relative px-4 py-3 transition-all hover:bg-muted/50 cursor-default",
                                        !notification.is_read && "bg-primary/5 border-l-2 border-l-primary"
                                    )}
                                    // onClick={() => handleNotificationClick(notification.id)} -- vou deixar sem onClick no container inteiro para evitar conflitos?
                                    // Não, o user quer que "Ao clicar ... dispara a função para marcar como lida".
                                    // Então deve ter onClick.
                                    onClick={() => handleNotificationClick(notification.id)}
                                >
                                    {/* Badge de não lida */}
                                    {!notification.is_read && (
                                        <div className="absolute top-4 right-4">
                                            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                                        </div>
                                    )}

                                    {/* Conteúdo */}
                                    <div className="flex gap-3 pr-6">
                                        <div className="flex-shrink-0 text-2xl mt-0.5">
                                            {getNotificationIcon(notification.type)}
                                        </div>
                                        <div className="flex-1 min-w-0 space-y-1">
                                            <p className="text-sm font-semibold leading-tight">
                                                {notification.title}
                                            </p>
                                            <p className="text-sm text-muted-foreground leading-snug line-clamp-2">
                                                {notification.message}
                                            </p>
                                            <p className="text-xs text-muted-foreground/70">
                                                {formatDistanceToNow(new Date(notification.created_at), {
                                                    addSuffix: true,
                                                    locale: ptBR,
                                                })}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Ações (aparecem no hover) */}
                                    <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {!notification.is_read && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    markAsRead(notification.id);
                                                }}
                                                title="Marcar como lida"
                                            >
                                                <Check className="h-3.5 w-3.5" />
                                            </Button>
                                        )}
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 text-destructive hover:text-destructive"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                deleteNotification(notification.id);
                                            }}
                                            title="Deletar"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>

                {/* Footer */}
                {notifications.length > 0 && (
                    <div className="border-t px-4 py-2 bg-muted/20">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="w-full h-8 text-xs font-medium"
                            onClick={() => {
                                setOpen(false);
                                navigate('/dashboard');
                            }}
                        >
                            Ver todas no Dashboard
                        </Button>
                    </div>
                )}
            </PopoverContent>
        </Popover>
    );
}
