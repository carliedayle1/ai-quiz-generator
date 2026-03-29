import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { PageProps } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { AlertTriangle, BarChart3, Download, TrendingUp, Trophy, Users } from 'lucide-react';
import { antiCheatLabel } from '@/lib/antiCheatLabels';

interface OverallStats {
    total_submissions: number;
    avg_score: number | null;
    pass_rate: number;
    quiz_count: number;
}

interface QuizStat {
    id: number;
    title: string;
    class_name: string | null;
    status: string;
    submission_count: number;
    avg_score: number | null;
    high_score: number | null;
    low_score: number | null;
    pass_rate: number | null;
}

interface FlaggedSubmission {
    submission_id: number;
    student_name: string;
    quiz_title: string | null;
    flag_count: number;
    score: number | null;
}

export default function Index({
    stats,
    quizStats,
    flaggedSubmissions,
}: PageProps<{ stats: OverallStats; quizStats: QuizStat[]; flaggedSubmissions: FlaggedSubmission[] }>) {
    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center gap-2">
                    <BarChart3 className="h-6 w-6" />
                    <h2 className="text-xl font-bold leading-tight text-foreground">Analytics</h2>
                </div>
            }
        >
            <Head title="Analytics" />

            <div className="py-12">
                <div className="mx-auto max-w-6xl sm:px-6 lg:px-8 space-y-6">
                    {/* Overall stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <StatCard
                            icon={<Users className="h-5 w-5" />}
                            label="Total Submissions"
                            value={String(stats.total_submissions)}
                        />
                        <StatCard
                            icon={<TrendingUp className="h-5 w-5" />}
                            label="Avg Score"
                            value={stats.avg_score !== null ? `${stats.avg_score}%` : '—'}
                        />
                        <StatCard
                            icon={<Trophy className="h-5 w-5" />}
                            label="Pass Rate (≥60%)"
                            value={`${stats.pass_rate}%`}
                        />
                        <StatCard
                            icon={<BarChart3 className="h-5 w-5" />}
                            label="Total Quizzes"
                            value={String(stats.quiz_count)}
                        />
                    </div>

                    {/* Per-quiz breakdown */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Quiz Performance</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {quizStats.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-8">No submissions yet.</p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b-2 border-foreground">
                                                <th className="text-left py-2 pr-4 font-bold">Quiz</th>
                                                <th className="text-left py-2 pr-4 font-bold">Class</th>
                                                <th className="text-right py-2 pr-4 font-bold">Submissions</th>
                                                <th className="text-right py-2 pr-4 font-bold">Avg</th>
                                                <th className="text-right py-2 pr-4 font-bold">High</th>
                                                <th className="text-right py-2 pr-4 font-bold">Low</th>
                                                <th className="text-right py-2 pr-4 font-bold">Pass %</th>
                                                <th className="text-right py-2 font-bold">Export</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {quizStats.map((qs) => (
                                                <tr key={qs.id}>
                                                    <td className="py-2 pr-4">
                                                        <span className="font-medium">{qs.title}</span>
                                                        {' '}
                                                        <Badge variant={qs.status === 'published' ? 'default' : 'secondary'} className="text-xs ml-1">
                                                            {qs.status}
                                                        </Badge>
                                                    </td>
                                                    <td className="py-2 pr-4 text-muted-foreground">{qs.class_name ?? '—'}</td>
                                                    <td className="py-2 pr-4 text-right">{qs.submission_count}</td>
                                                    <td className="py-2 pr-4 text-right">{qs.avg_score !== null ? `${qs.avg_score}%` : '—'}</td>
                                                    <td className="py-2 pr-4 text-right text-green-600 dark:text-green-400">{qs.high_score !== null ? `${qs.high_score}%` : '—'}</td>
                                                    <td className="py-2 pr-4 text-right text-destructive">{qs.low_score !== null ? `${qs.low_score}%` : '—'}</td>
                                                    <td className="py-2 pr-4 text-right">{qs.pass_rate !== null ? `${qs.pass_rate}%` : '—'}</td>
                                                    <td className="py-2 text-right">
                                                        {qs.submission_count > 0 && (
                                                            <a href={route('analytics.export-gradebook', qs.id)}>
                                                                <Button variant="ghost" size="icon" className="h-7 w-7">
                                                                    <Download className="h-4 w-4" />
                                                                </Button>
                                                            </a>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Anti-cheat flags */}
                    {flaggedSubmissions.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-destructive">
                                    <AlertTriangle className="h-5 w-5" />
                                    Anti-Cheat Flags
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b-2 border-foreground">
                                                <th className="text-left py-2 pr-4 font-bold">Student</th>
                                                <th className="text-left py-2 pr-4 font-bold">Quiz</th>
                                                <th className="text-right py-2 pr-4 font-bold">Flags</th>
                                                <th className="text-right py-2 font-bold">Score</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {flaggedSubmissions.map((f) => (
                                                <tr key={f.submission_id}>
                                                    <td className="py-2 pr-4 font-medium">{f.student_name}</td>
                                                    <td className="py-2 pr-4 text-muted-foreground">{f.quiz_title ?? '—'}</td>
                                                    <td className="py-2 pr-4 text-right">
                                                        <Badge variant="destructive">{f.flag_count}</Badge>
                                                    </td>
                                                    <td className="py-2 text-right">
                                                        {f.score !== null ? `${f.score}%` : '—'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return (
        <Card>
            <CardContent className="pt-5 pb-5">
                <div className="flex items-center gap-3">
                    <div className="text-muted-foreground">{icon}</div>
                    <div>
                        <p className="text-2xl font-bold text-foreground">{value}</p>
                        <p className="text-xs text-muted-foreground">{label}</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
