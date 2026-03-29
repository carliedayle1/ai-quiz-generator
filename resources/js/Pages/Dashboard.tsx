import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { PageProps, Quiz } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Bell, BookOpen, BellOff, Calendar, Clock } from 'lucide-react';

interface AppNotification {
    id: number;
    type: string;
    title: string;
    body: string | null;
    read_at: string | null;
    created_at: string;
    data: { route?: string } | null;
}

interface DashboardQuiz extends Quiz {
    classModel?: { id: number; name: string };
}

const NOTIF_ICONS: Record<string, React.ReactNode> = {
    quiz_opened: <BookOpen className="h-4 w-4 text-primary" />,
    quiz_missed: <BellOff className="h-4 w-4 text-destructive" />,
    study_tip: <BookOpen className="h-4 w-4 text-blue-500" />,
};

export default function Dashboard({
    upcomingQuizzes,
    recentNotifications,
}: PageProps<{ upcomingQuizzes: DashboardQuiz[]; recentNotifications: AppNotification[] }>) {
    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-bold leading-tight text-foreground">
                    Dashboard
                </h2>
            }
        >
            <Head title="Dashboard" />

            <div className="py-12">
                <div className="mx-auto max-w-5xl sm:px-6 lg:px-8 space-y-6">
                    {/* Upcoming Quizzes */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BookOpen className="h-5 w-5" />
                                Upcoming Quizzes
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {upcomingQuizzes.length === 0 ? (
                                <p className="text-sm text-muted-foreground py-4 text-center">
                                    No pending quizzes. You're all caught up!
                                </p>
                            ) : (
                                <div className="divide-y divide-border">
                                    {upcomingQuizzes.map((quiz) => (
                                        <div key={quiz.id} className="flex items-center justify-between py-3 gap-4">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-foreground truncate">{quiz.title}</p>
                                                <div className="flex flex-wrap items-center gap-2 mt-1">
                                                    {quiz.classModel && (
                                                        <Badge variant="secondary" className="text-xs">
                                                            {quiz.classModel.name}
                                                        </Badge>
                                                    )}
                                                    {quiz.due_date && (
                                                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                                            <Calendar className="h-3 w-3" />
                                                            Due {new Date(quiz.due_date).toLocaleDateString()}
                                                        </span>
                                                    )}
                                                    {quiz.time_limit && (
                                                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                                            <Clock className="h-3 w-3" />
                                                            {quiz.time_limit} min
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            {quiz.available_from && new Date(quiz.available_from) > new Date() ? (
                                                <Badge variant="secondary" className="text-xs shrink-0">
                                                    Opens {new Date(quiz.available_from).toLocaleDateString()}
                                                </Badge>
                                            ) : (
                                                <Link href={route('quizzes.take', quiz.id)}>
                                                    <Button size="sm" variant="outline">
                                                        Start
                                                    </Button>
                                                </Link>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Recent Notifications */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Bell className="h-5 w-5" />
                                Recent Notifications
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {recentNotifications.length === 0 ? (
                                <p className="text-sm text-muted-foreground py-4 text-center">
                                    No notifications yet.
                                </p>
                            ) : (
                                <div className="divide-y divide-border">
                                    {recentNotifications.map((n) => (
                                        <div
                                            key={n.id}
                                            className={`flex items-start gap-3 py-3 ${!n.read_at ? 'opacity-100' : 'opacity-70'}`}
                                        >
                                            <span className="mt-0.5 shrink-0">
                                                {NOTIF_ICONS[n.type] ?? <Bell className="h-4 w-4 text-muted-foreground" />}
                                            </span>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium">{n.title}</p>
                                                {n.body && (
                                                    <p className="text-xs text-muted-foreground mt-0.5">{n.body}</p>
                                                )}
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {new Date(n.created_at).toLocaleString()}
                                                </p>
                                            </div>
                                            {!n.read_at && (
                                                <span className="mt-1.5 h-2 w-2 rounded-full bg-primary shrink-0" />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
