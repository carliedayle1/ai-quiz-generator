import { Bell, BookOpen, BellOff, CheckCheck, Share2, X, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { usePage, router, Link } from '@inertiajs/react';
import { PageProps } from '@/types';
import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { cn } from '@/lib/utils';

interface AppNotification {
    id: number;
    type: string;
    title: string;
    body: string | null;
    data: Record<string, any> | null;
    read_at: string | null;
    seen_at: string | null;
    share_status?: string;
    created_at: string;
}

interface ClassOption { id: number; name: string; }

interface Props {
    collapsed?: boolean;
    variant?: 'sidebar' | 'topbar';
}

const ICONS: Record<string, React.ReactNode> = {
    quiz_opened: <BookOpen className="h-4 w-4 text-primary" />,
    quiz_missed: <BellOff className="h-4 w-4 text-destructive" />,
    study_tip: <BookOpen className="h-4 w-4 text-blue-500" />,
    quiz_shared: <Share2 className="h-4 w-4 text-orange-500" />,
};

function timeAgo(dateStr: string): string {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}

export default function NotificationBell({ collapsed = false, variant = 'sidebar' }: Props) {
    const { unread_notifications } = usePage<PageProps>().props;
    const [open, setOpen] = useState(false);
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [classes, setClasses] = useState<ClassOption[]>([]);
    const [loading, setLoading] = useState(false);
    const [pendingAccept, setPendingAccept] = useState<AppNotification | null>(null);
    const [selectedClassId, setSelectedClassId] = useState<string>('');
    const panelRef = useRef<HTMLDivElement>(null);
    const prevUnread = useRef(unread_notifications);

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const [notifResp, classResp] = await Promise.all([
                axios.get(route('notifications.index')),
                axios.get(route('classes.list-json')),
            ]);
            setNotifications(notifResp.data.notifications);
            setClasses(classResp.data.classes ?? []);
        } catch {
            // silently ignore
        } finally {
            setLoading(false);
        }
    };

    // On open: fetch + mark seen (clears badge)
    useEffect(() => {
        if (open) {
            fetchNotifications();
            axios.post(route('notifications.mark-seen'))
                .then(() => router.reload({ only: ['unread_notifications'] }));
        }
    }, [open]);

    // Reactive: if new notifications arrive while bell is open, re-fetch
    useEffect(() => {
        if (open && unread_notifications > prevUnread.current) {
            fetchNotifications();
        }
        prevUnread.current = unread_notifications;
    }, [unread_notifications]);

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
                setOpen(false);
                setPendingAccept(null);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const markRead = async (id: number) => {
        await axios.post(route('notifications.read', id));
        setNotifications(prev =>
            prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString(), seen_at: new Date().toISOString() } : n)
        );
        router.reload({ only: ['unread_notifications'] });
    };

    const markAllRead = async () => {
        await axios.post(route('notifications.read-all'));
        setNotifications(prev => prev.map(n => ({
            ...n,
            seen_at: n.seen_at ?? new Date().toISOString(),
            read_at: n.type !== 'quiz_shared' ? (n.read_at ?? new Date().toISOString()) : n.read_at,
        })));
        router.reload({ only: ['unread_notifications'] });
    };

    const handleAcceptClick = (n: AppNotification) => {
        setPendingAccept(n);
        setSelectedClassId(classes.length === 1 ? String(classes[0].id) : '');
    };

    const handleConfirmAccept = () => {
        if (!pendingAccept || !selectedClassId) return;
        const shareId = pendingAccept.data?.share_id;
        if (!shareId) return;
        setPendingAccept(null);
        setOpen(false);
        router.post(route('shares.accept', shareId), { class_id: selectedClassId }, {
            onError: () => alert('Something went wrong. Please try again.'),
        });
    };

    const handleDecline = (n: AppNotification) => {
        const shareId = n.data?.share_id;
        if (!shareId) return;
        setOpen(false);
        router.post(route('shares.decline', shareId), {}, {
            onError: () => alert('Something went wrong.'),
        });
    };

    const handleNotificationClick = (n: AppNotification) => {
        if (n.type === 'quiz_shared') return;
        if (!n.read_at) markRead(n.id);
        if (n.data?.route) {
            router.visit(n.data.route);
            setOpen(false);
        }
    };

    return (
        <div className="relative" ref={panelRef}>
            {variant === 'topbar' ? (
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative"
                    onClick={() => setOpen(prev => !prev)}
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
            ) : (
                <button
                    type="button"
                    onClick={() => setOpen(prev => !prev)}
                    aria-label="Notifications"
                    className={cn(
                        'flex w-full items-center rounded-md transition-colors hover:bg-accent text-foreground',
                        collapsed ? 'justify-center p-2' : 'gap-3 px-3 py-2',
                        open && 'bg-accent'
                    )}
                >
                    <span className="relative shrink-0">
                        <Bell className="h-5 w-5" />
                        {unread_notifications > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                                {unread_notifications > 9 ? '9+' : unread_notifications}
                            </span>
                        )}
                    </span>
                    {!collapsed && (
                        <span className="flex-1 text-sm font-medium text-left">Notifications</span>
                    )}
                </button>
            )}

            {/* Dropdown panel */}
            {open && (
                <div
                    className="z-50 w-80 border-3 border-foreground bg-background shadow-brutal-lg flex flex-col"
                    style={variant === 'sidebar'
                        ? { position: 'fixed', left: 'var(--sidebar-width, 256px)', bottom: '48px', maxHeight: '480px' }
                        : { position: 'absolute', right: 0, top: '100%', marginTop: '4px', maxHeight: '480px' }
                    }
                >
                    {/* Header */}
                    <div className="flex items-center justify-between border-b-2 border-border px-3 py-2 shrink-0">
                        <span className="text-sm font-bold">Notifications</span>
                        <div className="flex items-center gap-1">
                            {notifications.some(n => !n.seen_at) && (
                                <Button variant="ghost" size="sm" className="h-6 text-xs gap-1" onClick={markAllRead}>
                                    <CheckCheck className="h-3 w-3" /> Mark all read
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Class picker for accepting */}
                    {pendingAccept && (
                        <div className="border-b-2 border-border px-3 py-3 bg-primary/5 shrink-0">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-xs font-semibold">Select class for this quiz</p>
                                <button type="button" onClick={() => setPendingAccept(null)} className="text-muted-foreground hover:text-foreground">
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            </div>
                            {classes.length === 0 ? (
                                <p className="text-xs text-destructive mb-2">No classes found.</p>
                            ) : (
                                <select
                                    className="w-full border-2 border-foreground bg-background px-2 py-1.5 text-xs mb-2 focus:outline-none"
                                    value={selectedClassId}
                                    onChange={e => setSelectedClassId(e.target.value)}
                                >
                                    <option value="">— Select a class —</option>
                                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            )}
                            <div className="flex gap-2">
                                <Button size="sm" className="h-6 text-xs flex-1" onClick={handleConfirmAccept} disabled={!selectedClassId}>
                                    Confirm Accept
                                </Button>
                                <Button size="sm" variant="outline" className="h-6 text-xs" onClick={() => setPendingAccept(null)}>
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Notification list */}
                    <div className="overflow-y-auto flex-1 divide-y divide-border">
                        {loading ? (
                            <p className="text-center text-sm text-muted-foreground py-6">Loading…</p>
                        ) : notifications.length === 0 ? (
                            <p className="text-center text-sm text-muted-foreground py-6">No notifications yet.</p>
                        ) : (
                            notifications.map(n => (
                                <div
                                    key={n.id}
                                    className={cn(
                                        'px-3 py-3 flex items-start gap-3',
                                        !n.seen_at && 'bg-primary/5',
                                        n.type !== 'quiz_shared' && n.data?.route && 'cursor-pointer hover:bg-accent transition-colors'
                                    )}
                                    onClick={() => handleNotificationClick(n)}
                                >
                                    <span className="mt-0.5 shrink-0">
                                        {ICONS[n.type] ?? <Bell className="h-4 w-4 text-muted-foreground" />}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{n.title}</p>
                                        {n.body && (
                                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>
                                        )}
                                        <p className="text-xs text-muted-foreground mt-1">{timeAgo(n.created_at)}</p>

                                        {/* quiz_shared actions based on live share_status */}
                                        {n.type === 'quiz_shared' && n.share_status === 'pending' && (
                                            <div className="flex gap-2 mt-2">
                                                <button
                                                    type="button"
                                                    onClick={e => { e.stopPropagation(); handleAcceptClick(n); }}
                                                    className="flex items-center gap-1 px-2 py-0.5 text-xs bg-primary text-primary-foreground font-medium hover:bg-primary/90"
                                                >
                                                    <CheckCircle className="h-3 w-3" /> Accept
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={e => { e.stopPropagation(); handleDecline(n); }}
                                                    className="flex items-center gap-1 px-2 py-0.5 text-xs border border-border text-muted-foreground hover:text-foreground"
                                                >
                                                    <XCircle className="h-3 w-3" /> Decline
                                                </button>
                                            </div>
                                        )}
                                        {n.type === 'quiz_shared' && n.share_status === 'accepted' && (
                                            <p className="text-xs text-green-600 dark:text-green-400 mt-1 italic">Accepted</p>
                                        )}
                                        {n.type === 'quiz_shared' && n.share_status === 'declined' && (
                                            <p className="text-xs text-muted-foreground mt-1 italic">Declined</p>
                                        )}
                                    </div>
                                    {!n.seen_at && n.type !== 'quiz_shared' && (
                                        <span className="mt-1.5 h-2 w-2 rounded-full bg-primary shrink-0" />
                                    )}
                                </div>
                            ))
                        )}
                    </div>

                    {/* Footer: view all link */}
                    <div className="border-t-2 border-border px-3 py-2 text-center shrink-0">
                        <Link
                            href={route('notifications.page')}
                            onClick={() => setOpen(false)}
                            className="text-xs font-medium text-primary hover:underline"
                        >
                            View all notifications →
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
