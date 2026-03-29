import { Bell, BookOpen, BellOff, CheckCheck } from 'lucide-react';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { usePage, router } from '@inertiajs/react';
import { PageProps } from '@/types';
import { useEffect, useRef, useState } from 'react';
import axios from 'axios';

interface AppNotification {
    id: number;
    type: string;
    title: string;
    body: string | null;
    data: Record<string, any> | null;
    read_at: string | null;
    created_at: string;
}

export default function NotificationBell() {
    const { unread_notifications } = usePage<PageProps>().props;
    const [open, setOpen] = useState(false);
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [loading, setLoading] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const resp = await axios.get(route('notifications.index'));
            setNotifications(resp.data.notifications);
        } catch {
            // silently ignore
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (open) fetchNotifications();
    }, [open]);

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const markRead = async (id: number) => {
        await axios.post(route('notifications.read', id));
        setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
        );
        router.reload({ only: ['unread_notifications'] });
    };

    const markAllRead = async () => {
        await axios.post(route('notifications.read-all'));
        setNotifications((prev) => prev.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })));
        router.reload({ only: ['unread_notifications'] });
    };

    const ICONS: Record<string, React.ReactNode> = {
        quiz_opened: <BookOpen className="h-4 w-4 text-primary" />,
        quiz_missed: <BellOff className="h-4 w-4 text-destructive" />,
        study_tip: <BookOpen className="h-4 w-4 text-blue-500" />,
    };

    return (
        <div className="relative" ref={panelRef}>
            <Button
                variant="ghost"
                size="icon"
                className="relative"
                onClick={() => setOpen((prev) => !prev)}
                aria-label="Notifications"
            >
                <Bell className="h-5 w-5" />
                {unread_notifications > 0 && (
                    <Badge
                        variant="destructive"
                        className="absolute -top-1 -right-1 h-4 min-w-4 px-1 text-xs flex items-center justify-center"
                    >
                        {unread_notifications > 9 ? '9+' : unread_notifications}
                    </Badge>
                )}
            </Button>

            {open && (
                <div className="absolute right-0 top-full mt-1 w-80 z-50 border-3 border-foreground bg-background shadow-brutal-lg">
                    <div className="flex items-center justify-between border-b-2 border-border px-3 py-2">
                        <span className="text-sm font-bold">Notifications</span>
                        {notifications.some((n) => !n.read_at) && (
                            <Button variant="ghost" size="sm" className="h-6 text-xs gap-1" onClick={markAllRead}>
                                <CheckCheck className="h-3 w-3" /> Mark all read
                            </Button>
                        )}
                    </div>

                    <div className="max-h-80 overflow-y-auto divide-y divide-border">
                        {loading ? (
                            <p className="text-center text-sm text-muted-foreground py-6">Loading…</p>
                        ) : notifications.length === 0 ? (
                            <p className="text-center text-sm text-muted-foreground py-6">No notifications yet.</p>
                        ) : (
                            notifications.map((n) => (
                                <button
                                    key={n.id}
                                    type="button"
                                    onClick={() => {
                                        if (!n.read_at) markRead(n.id);
                                        if (n.data?.route) {
                                            router.visit(n.data.route);
                                            setOpen(false);
                                        }
                                    }}
                                    className={`w-full text-left px-3 py-3 flex items-start gap-3 transition-colors hover:bg-accent ${
                                        !n.read_at ? 'bg-primary/5' : ''
                                    }`}
                                >
                                    <span className="mt-0.5 shrink-0">{ICONS[n.type] ?? <Bell className="h-4 w-4 text-muted-foreground" />}</span>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{n.title}</p>
                                        {n.body && (
                                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>
                                        )}
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {new Date(n.created_at).toLocaleString()}
                                        </p>
                                    </div>
                                    {!n.read_at && (
                                        <span className="mt-1.5 h-2 w-2 rounded-full bg-primary shrink-0" />
                                    )}
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
