import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { PageProps } from '@/types';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { Card, CardContent } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import { BookOpen, Copy, Loader2, Search, X } from 'lucide-react';
import { useState } from 'react';

interface BankQuiz {
    id: number;
    title: string;
    description: string | null;
    time_limit: number | null;
    questions_count: number;
    class_model: {
        id: number;
        name: string;
        teacher: {
            id: number;
            first_name: string;
            last_name: string;
        } | null;
    } | null;
    created_at: string;
}

interface PaginatedQuizzes {
    data: BankQuiz[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
}

interface ClassOption {
    id: number;
    name: string;
}

export default function QuizBankIndex({
    quizzes,
    search: initialSearch,
    classes,
}: PageProps<{ quizzes: PaginatedQuizzes; search: string; classes: ClassOption[] }>) {
    const [search, setSearch] = useState(initialSearch);
    const [cloningId, setCloningId] = useState<number | null>(null);
    const [copyTarget, setCopyTarget] = useState<BankQuiz | null>(null);
    const [selectedClassId, setSelectedClassId] = useState<string>('');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(route('quiz-bank.index'), { search }, { preserveState: true });
    };

    const handleCopyClick = (quiz: BankQuiz) => {
        setCopyTarget(quiz);
        setSelectedClassId(classes.length === 1 ? String(classes[0].id) : '');
    };

    const handleConfirmCopy = () => {
        if (!copyTarget || !selectedClassId) return;
        const quizId = copyTarget.id;
        setCloningId(quizId);
        setCopyTarget(null);
        router.post(route('quizzes.clone', quizId), { class_id: selectedClassId }, {
            onFinish: () => setCloningId(null),
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                        <BookOpen className="h-5 w-5" />
                        Global Quiz Bank
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        {quizzes.total} public quiz{quizzes.total !== 1 ? 'zes' : ''}
                    </p>
                </div>
            }
        >
            <Head title="Quiz Bank" />

            <div className="py-12">
                <div className="mx-auto max-w-5xl sm:px-6 lg:px-8 space-y-6">
                    {/* Search */}
                    <form onSubmit={handleSearch} className="flex gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Search quiz titles..."
                                className="pl-9"
                            />
                        </div>
                        <Button type="submit" variant="outline">Search</Button>
                    </form>

                    {/* Quiz grid */}
                    {quizzes.data.length === 0 ? (
                        <div className="text-center py-16 text-muted-foreground">
                            <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-30" />
                            <p className="text-sm">No public quizzes found{search ? ' for that search' : '. Be the first to share one!'}.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {quizzes.data.map((quiz) => (
                                <Card key={quiz.id} className="border-3">
                                    <CardContent className="pt-4 pb-4">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-semibold text-foreground truncate">{quiz.title}</h3>
                                                {quiz.description && (
                                                    <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{quiz.description}</p>
                                                )}
                                                <div className="flex flex-wrap items-center gap-2 mt-2">
                                                    {quiz.class_model?.teacher && (
                                                        <span className="text-xs text-muted-foreground">
                                                            by {quiz.class_model.teacher.first_name} {quiz.class_model.teacher.last_name}
                                                        </span>
                                                    )}
                                                    {quiz.class_model && (
                                                        <Badge variant="outline" className="text-xs">{quiz.class_model.name}</Badge>
                                                    )}
                                                    <Badge variant="secondary" className="text-xs">
                                                        {quiz.questions_count} question{quiz.questions_count !== 1 ? 's' : ''}
                                                    </Badge>
                                                    {quiz.time_limit && (
                                                        <Badge variant="outline" className="text-xs">{quiz.time_limit} min</Badge>
                                                    )}
                                                </div>
                                            </div>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleCopyClick(quiz)}
                                                disabled={cloningId !== null}
                                                className="shrink-0"
                                            >
                                                {cloningId === quiz.id
                                                    ? <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />Copying...</>
                                                    : <><Copy className="mr-1.5 h-3.5 w-3.5" />Copy to My Quizzes</>
                                                }
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}

                    {/* Pagination */}
                    {quizzes.last_page > 1 && (
                        <div className="flex justify-center gap-1 flex-wrap">
                            {quizzes.links.map((link, i) => (
                                <Button
                                    key={i}
                                    variant={link.active ? 'default' : 'outline'}
                                    size="sm"
                                    disabled={!link.url}
                                    onClick={() => link.url && router.get(link.url)}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                    className="min-w-[2.5rem]"
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Class picker modal */}
            {copyTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-background border-3 border-foreground shadow-brutal-lg w-full max-w-sm mx-4 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-base">Copy to Which Class?</h3>
                            <button type="button" onClick={() => setCopyTarget(null)} className="text-muted-foreground hover:text-foreground">
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">
                            Select the class where <span className="font-medium text-foreground">"{copyTarget.title}"</span> will be added.
                        </p>
                        {classes.length === 0 ? (
                            <p className="text-sm text-destructive mb-4">You have no classes. Create a class first.</p>
                        ) : (
                            <select
                                className="w-full border-2 border-foreground bg-background px-3 py-2 text-sm mb-4 focus:outline-none"
                                value={selectedClassId}
                                onChange={e => setSelectedClassId(e.target.value)}
                            >
                                <option value="">— Select a class —</option>
                                {classes.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        )}
                        <div className="flex gap-2 justify-end">
                            <Button variant="outline" size="sm" onClick={() => setCopyTarget(null)}>Cancel</Button>
                            <Button size="sm" onClick={handleConfirmCopy} disabled={!selectedClassId}>
                                <Copy className="mr-1.5 h-3.5 w-3.5" /> Copy Quiz
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
