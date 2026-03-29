import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { router } from '@inertiajs/react';
import { Head } from '@inertiajs/react';
import { PageProps, Question } from '@/types';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { Card, CardContent } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import { BookOpen, CheckCircle, Clock, Copy, Eye, Loader2, Search, X } from 'lucide-react';
import { useState } from 'react';
import axios from 'axios';

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

interface PreviewQuiz {
    id: number;
    title: string;
    description: string | null;
    time_limit: number | null;
    class_model: { name: string } | null;
    questions: Question[];
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

const TYPE_LABELS: Record<string, string> = {
    multiple_choice: 'Multiple Choice',
    true_false: 'True / False',
    identification: 'Identification',
    coding: 'Coding',
    essay: 'Essay',
    section_header: 'Section',
};

function QuestionPreview({ question, index }: { question: Question; index: number }) {
    if (question.type === 'section_header') {
        return (
            <div className="flex items-center gap-3 py-1">
                <div className="flex-1 border-t-2 border-foreground" />
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">
                    {question.content.title ?? 'Section'}
                </span>
                <div className="flex-1 border-t-2 border-foreground" />
            </div>
        );
    }

    const { question: text, options, answer, base_code } = question.content;

    return (
        <div className="border-2 border-border rounded p-3 space-y-2">
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground font-medium">Q{index}</span>
                    <Badge variant="outline" className="text-xs">{TYPE_LABELS[question.type] ?? question.type}</Badge>
                </div>
                <span className="text-xs text-muted-foreground">{question.points} pt{question.points !== 1 ? 's' : ''}</span>
            </div>

            <p className="text-sm font-medium">{text}</p>

            {base_code && (
                <pre className="text-xs bg-muted border border-border rounded p-2 overflow-x-auto font-mono whitespace-pre-wrap">{base_code}</pre>
            )}

            {question.type === 'multiple_choice' && Array.isArray(options) && (
                <ul className="space-y-1">
                    {options.map((opt: string, i: number) => {
                        const letter = String.fromCharCode(65 + i);
                        const isCorrect = answer === letter || answer === opt;
                        return (
                            <li key={i} className={`flex items-center gap-2 text-xs px-2 py-1 rounded ${isCorrect ? 'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 font-medium' : 'text-muted-foreground'}`}>
                                <span className="font-mono w-4 shrink-0">{letter}.</span>
                                <span>{opt}</span>
                                {isCorrect && <CheckCircle className="h-3 w-3 ml-auto shrink-0" />}
                            </li>
                        );
                    })}
                </ul>
            )}

            {question.type === 'true_false' && (
                <p className="text-xs">
                    <span className="text-muted-foreground">Answer: </span>
                    <span className="font-medium text-green-700 dark:text-green-300">{String(answer)}</span>
                </p>
            )}

            {question.type === 'identification' && answer && (
                <p className="text-xs">
                    <span className="text-muted-foreground">Answer: </span>
                    <span className="font-medium text-green-700 dark:text-green-300">{answer}</span>
                </p>
            )}

            {(question.type === 'essay' || question.type === 'coding') && (
                <p className="text-xs text-muted-foreground italic">Open-ended response</p>
            )}
        </div>
    );
}

export default function QuizBankIndex({
    quizzes,
    search: initialSearch,
    classes,
}: PageProps<{ quizzes: PaginatedQuizzes; search: string; classes: ClassOption[] }>) {
    const [search, setSearch] = useState(initialSearch);
    const [cloningId, setCloningId] = useState<number | null>(null);

    // Copy modal
    const [copyTarget, setCopyTarget] = useState<BankQuiz | null>(null);
    const [selectedClassId, setSelectedClassId] = useState<string>('');

    // Preview modal
    const [previewQuiz, setPreviewQuiz] = useState<PreviewQuiz | null>(null);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [previewingId, setPreviewingId] = useState<number | null>(null);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(route('quiz-bank.index'), { search }, { preserveState: true });
    };

    const handlePreview = async (quiz: BankQuiz) => {
        setPreviewingId(quiz.id);
        setPreviewLoading(true);
        try {
            const resp = await axios.get(route('quiz-bank.preview', quiz.id));
            setPreviewQuiz(resp.data.quiz);
        } catch {
            // ignore
        } finally {
            setPreviewLoading(false);
            setPreviewingId(null);
        }
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
        setPreviewQuiz(null);
        router.post(route('quizzes.clone', quizId), { class_id: selectedClassId }, {
            onFinish: () => setCloningId(null),
        });
    };

    // Questions excluding section headers for numbering
    const realQuestions = previewQuiz?.questions.filter(q => q.type !== 'section_header') ?? [];
    let realIndex = 0;

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
                                            <div className="flex gap-2 shrink-0">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handlePreview(quiz)}
                                                    disabled={previewingId === quiz.id}
                                                >
                                                    {previewingId === quiz.id
                                                        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                        : <Eye className="h-3.5 w-3.5" />
                                                    }
                                                    <span className="ml-1.5">Preview</span>
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleCopyClick(quiz)}
                                                    disabled={cloningId !== null}
                                                >
                                                    {cloningId === quiz.id
                                                        ? <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />Copying...</>
                                                        : <><Copy className="mr-1.5 h-3.5 w-3.5" />Copy</>
                                                    }
                                                </Button>
                                            </div>
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

            {/* Preview modal */}
            {(previewLoading || previewQuiz) && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-background border-3 border-foreground shadow-brutal-lg w-full max-w-2xl max-h-[90vh] flex flex-col">
                        {previewLoading ? (
                            <div className="flex items-center justify-center py-20">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : previewQuiz && (
                            <>
                                {/* Header */}
                                <div className="flex items-start justify-between gap-4 px-5 py-4 border-b-2 border-border">
                                    <div className="min-w-0">
                                        <h2 className="font-bold text-lg leading-tight truncate">{previewQuiz.title}</h2>
                                        <div className="flex flex-wrap items-center gap-2 mt-1">
                                            {previewQuiz.class_model && (
                                                <Badge variant="outline" className="text-xs">{previewQuiz.class_model.name}</Badge>
                                            )}
                                            <Badge variant="secondary" className="text-xs">
                                                {realQuestions.length} question{realQuestions.length !== 1 ? 's' : ''}
                                            </Badge>
                                            {previewQuiz.time_limit && (
                                                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                                    <Clock className="h-3 w-3" />{previewQuiz.time_limit} min
                                                </span>
                                            )}
                                        </div>
                                        {previewQuiz.description && (
                                            <p className="text-sm text-muted-foreground mt-1">{previewQuiz.description}</p>
                                        )}
                                    </div>
                                    <button type="button" onClick={() => setPreviewQuiz(null)} className="text-muted-foreground hover:text-foreground shrink-0 mt-0.5">
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>

                                {/* Questions */}
                                <div className="overflow-y-auto flex-1 px-5 py-4 space-y-3">
                                    {previewQuiz.questions.map((q) => {
                                        const idx = q.type !== 'section_header' ? ++realIndex : 0;
                                        return <QuestionPreview key={q.id} question={q} index={idx} />;
                                    })}
                                </div>

                                {/* Footer */}
                                <div className="flex items-center justify-between gap-3 px-5 py-3 border-t-2 border-border">
                                    <Button variant="outline" size="sm" onClick={() => setPreviewQuiz(null)}>Close</Button>
                                    <Button size="sm" onClick={() => {
                                        const bankQuiz = quizzes.data.find(q => q.id === previewQuiz.id);
                                        if (bankQuiz) handleCopyClick(bankQuiz);
                                    }}>
                                        <Copy className="mr-1.5 h-3.5 w-3.5" /> Copy to My Quizzes
                                    </Button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Class picker modal */}
            {copyTarget && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
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
