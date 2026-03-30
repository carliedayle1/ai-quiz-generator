import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { Link } from '@inertiajs/react';
import { PageProps } from '@/types';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import {
    Bell, BellOff, BookOpen, CheckCheck, CheckCircle,
    Share2, XCircle, Loader2, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import axios from 'axios';

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

interface PaginatedNotifications {
    data: AppNotification[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
}

interface ClassOption { id: number; name: string; }

const TYPE_META: Record<string, { icon: React.ReactNode; label: string; badgeClass: string }> = {
    quiz_opened: {
        icon: <BookOpen className="h-4 w-4 text-primary" />,
        label: 'New Quiz',
        badgeClass: 'bg-primary/10 text-primary border-primary/20',
    },
    quiz_missed: {
        icon: <BellOff className="h-4 w-4 text-destructive" />,
        label: 'Missed',
        badgeClass: 'bg-destructive/10 text-destructive border-destructive/20',
    },
    quiz_shared: {
        icon: <Share2 className="h-4 w-4 text-orange-500" />,
        label: 'Shared',
        badgeClass: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-300',
    },
    study_tip: {
        icon: <BookOpen className="h-4 w-4 text-blue-500" />,
        label: 'Study Tip',
        badgeClass: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300',
    },
};

function timeAgo(dateStr: string): string {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return new Date(dateStr).toLocaleDateString();
}

export default function NotificationsIndex({
    notifications,
}: PageProps<{ notifications: PaginatedNotifications }>) {
    const [classes, setClasses] = useState<ClassOption[]>([]);
    const [pendingAccept, setPendingAccept] = useState<AppNotification | null>(null);
    const [selectedClassId, setSelectedClassId] = useState<string>('');
    const [accepting, setAccepting] = useState(false);

    useEffect(() => {
        axios.get(route('classes.list-json'))
            .then(r => setClasses(r.data.classes ?? []))
            .catch(() => {});
    }, []);

    const markRead = (id: number) => {
        axios.post(route('notifications.read', id))
            .then(() => router.reload({ only: ['notifications'] }));
    };

    const markAllRead = () => {
        axios.post(route('notifications.read-all'))
            .then(() => router.reload({ only: ['notifications', 'unread_notifications'] }));
    };

    const handleAcceptClick = (n: AppNotification) => {
        setPendingAccept(n);
        setSelectedClassId(classes.length === 1 ? String(classes[0].id) : '');
    };

    const handleConfirmAccept = () => {
        if (!pendingAccept || !selectedClassId) return;
        const shareId = pendingAccept.data?.share_id;
        if (!shareId) return;
        setAccepting(true);
        router.post(route('shares.accept', shareId), { class_id: selectedClassId }, {
            onFinish: () => { setAccepting(false); setPendingAccept(null); },
            onError: () => { setAccepting(false); alert('Something went wrong.'); },
        });
    };

    const handleDecline = (n: AppNotification) => {
        const shareId = n.data?.share_id;
        if (!shareId) return;
        router.post(route('shares.decline', shareId), {}, {
            onError: () => alert('Something went wrong.'),
        });
    };

    const navigateTo = (n: AppNotification) => {
        if (n.type === 'quiz_shared') return;
        if (!n.read_at) markRead(n.id);
        if (n.data?.route) router.visit(n.data.route);
    };

    const hasUnread = notifications.data.some(n => !n.read_at);

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                        <Bell className="h-5 w-5" />
                        <h2 className="text-xl font-bold">Notifications</h2>
                        <Badge variant="secondary">{notifications.total} total</Badge>
                    </div>
                    {hasUnread && (
                        <Button variant="outline" size="sm" onClick={markAllRead}>
                            <CheckCheck className="mr-2 h-4 w-4" /> Mark all read
                        </Button>
                    )}
                </div>
            }
        >
            <Head title="Notifications" />

            <div className="py-10">
                <div className="mx-auto max-w-3xl sm:px-6 lg:px-8 space-y-3">

                    {notifications.data.length === 0 ? (
                        <div className="text-center py-24 text-muted-foreground">
                            <Bell className="h-14 w-14 mx-auto mb-4 opacity-20" />
                            <p className="text-base font-medium">You're all caught up</p>
                            <p className="text-sm mt-1">No notifications yet.</p>
                        </div>
                    ) : (
                        notifications.data.map((n) => {
                            const meta = TYPE_META[n.type] ?? {
                                icon: <Bell className="h-4 w-4 text-muted-foreground" />,
                                label: n.type,
                                badgeClass: '',
                            };
                            const isUnseen = !n.seen_at;
                            const isUnread = !n.read_at;

                            return (
                                <div
                                    key={n.id}
                                    className={[
                                        'border-2 border-border rounded p-4 transition-colors',
                                        isUnseen ? 'bg-primary/5 border-primary/30' : 'bg-card',
                                        n.type !== 'quiz_shared' && n.data?.route ? 'cursor-pointer hover:bg-accent' : '',
                                    ].join(' ')}
                                    onClick={() => navigateTo(n)}
                                >
                                    <div className="flex items-start gap-3">
                                        {/* Icon */}
                                        <div className="mt-0.5 shrink-0">{meta.icon}</div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-semibold text-sm">{n.title}</span>
                                                <span className={`inline-flex items-center border rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${meta.badgeClass}`}>
                                                    {meta.label}
                                                </span>
                                                {isUnseen && (
                                                    <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
                                                )}
                                            </div>

                                            {n.body && (
                                                <p className="text-sm text-muted-foreground mt-1">{n.body}</p>
                                            )}

                                            <p className="text-xs text-muted-foreground mt-1.5">{timeAgo(n.created_at)}</p>

                                            {/* quiz_shared actions */}
                                            {n.type === 'quiz_shared' && n.share_status === 'pending' && (
                                                <div className="mt-3 space-y-2">
                                                    {pendingAccept?.id === n.id ? (
                                                        <div className="flex flex-col gap-2">
                                                            <select
                                                                className="border-2 border-foreground bg-background px-3 py-1.5 text-sm focus:outline-none w-full max-w-xs"
                                                                value={selectedClassId}
                                                                onChange={e => setSelectedClassId(e.target.value)}
                                                            >
                                                                <option value="">— Select a class —</option>
                                                                {classes.map(c => (
                                                                    <option key={c.id} value={c.id}>{c.name}</option>
                                                                ))}
                                                            </select>
                                                            <div className="flex gap-2">
                                                                <Button
                                                                    size="sm"
                                                                    onClick={e => { e.stopPropagation(); handleConfirmAccept(); }}
                                                                    disabled={!selectedClassId || accepting}
                                                                >
                                                                    {accepting
                                                                        ? <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />Accepting…</>
                                                                        : <><CheckCircle className="mr-1.5 h-3.5 w-3.5" />Confirm Accept</>
                                                                    }
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={e => { e.stopPropagation(); setPendingAccept(null); }}
                                                                >
                                                                    Cancel
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="flex gap-2">
                                                            <Button
                                                                size="sm"
                                                                onClick={e => { e.stopPropagation(); handleAcceptClick(n); }}
                                                            >
                                                                <CheckCircle className="mr-1.5 h-3.5 w-3.5" /> Accept
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={e => { e.stopPropagation(); handleDecline(n); }}
                                                            >
                                                                <XCircle className="mr-1.5 h-3.5 w-3.5" /> Decline
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {n.type === 'quiz_shared' && n.share_status === 'accepted' && (
                                                <p className="text-xs text-green-600 dark:text-green-400 mt-2 font-medium">
                                                    ✓ Accepted — quiz added to your drafts
                                                </p>
                                            )}

                                            {n.type === 'quiz_shared' && n.share_status === 'declined' && (
                                                <p className="text-xs text-muted-foreground mt-2 italic">Declined</p>
                                            )}
                                        </div>

                                        {/* Mark read button for unread non-actionable */}
                                        {isUnread && n.type !== 'quiz_shared' && (
                                            <button
                                                type="button"
                                                title="Mark as read"
                                                className="shrink-0 text-muted-foreground hover:text-foreground mt-0.5"
                                                onClick={e => { e.stopPropagation(); markRead(n.id); }}
                                            >
                                                <CheckCircle className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}

                    {/* Pagination */}
                    {notifications.last_page > 1 && (
                        <div className="flex justify-center items-center gap-2 pt-4">
                            {notifications.links.map((link, i) => {
                                const isArrow = link.label.includes('&laquo;') || link.label.includes('&raquo;');
                                return (
                                    <Button
                                        key={i}
                                        variant={link.active ? 'default' : 'outline'}
                                        size="sm"
                                        disabled={!link.url}
                                        onClick={() => link.url && router.get(link.url)}
                                        className="min-w-[2.25rem]"
                                    >
                                        {link.label.includes('&laquo;')
                                            ? <ChevronLeft className="h-4 w-4" />
                                            : link.label.includes('&raquo;')
                                                ? <ChevronRight className="h-4 w-4" />
                                                : <span dangerouslySetInnerHTML={{ __html: link.label }} />
                                        }
                                    </Button>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
