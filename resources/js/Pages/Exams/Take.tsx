import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { PageProps, Quiz, Submission } from '@/types';
import { Button } from '@/Components/ui/button';
import { Card, CardContent } from '@/Components/ui/card';
import QuestionRenderer from '@/Components/Questions/QuestionRenderer';
import { useAntiCheat } from '@/hooks/useAntiCheat';
import { FormEventHandler, useEffect, useState } from 'react';
import { AlertTriangle, CheckSquare, Clock, Code, FileText, HelpCircle, Send, ToggleLeft } from 'lucide-react';
import { Badge } from '@/Components/ui/badge';

export default function Take({ quiz, submission }: PageProps<{ quiz: Quiz; submission: Submission }>) {
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);
    const [timeLeft, setTimeLeft] = useState<number | null>(
        quiz.time_limit ? quiz.time_limit * 60 : null
    );

    const { tabSwitchCount, warningVisible } = useAntiCheat(submission.id);

    // Timer
    useEffect(() => {
        if (timeLeft === null || timeLeft <= 0) return;

        const interval = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev === null || prev <= 1) {
                    clearInterval(interval);
                    handleSubmit();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [timeLeft !== null]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const setAnswer = (questionId: number, value: string) => {
        setAnswers((prev) => ({ ...prev, [questionId]: value }));
    };

    const handleSubmit = () => {
        if (submitting) return;
        setSubmitting(true);
        router.post(route('quizzes.submit', quiz.id), { answers }, {
            onFinish: () => setSubmitting(false),
        });
    };

    const confirmSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        if (confirm('Are you sure you want to submit? You cannot change your answers after submitting.')) {
            handleSubmit();
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold leading-tight text-foreground">
                        {quiz.title}
                    </h2>
                    <div className="flex items-center gap-4">
                        {tabSwitchCount > 0 && (
                            <div className="flex items-center gap-1 text-sm text-destructive">
                                <AlertTriangle className="h-4 w-4" />
                                {tabSwitchCount} tab switch{tabSwitchCount !== 1 ? 'es' : ''} detected
                            </div>
                        )}
                        {timeLeft !== null && (
                            <div className={`flex items-center gap-1 text-sm font-mono ${timeLeft < 60 ? 'text-destructive' : 'text-muted-foreground'}`}>
                                <Clock className="h-4 w-4" />
                                {formatTime(timeLeft)}
                            </div>
                        )}
                    </div>
                </div>
            }
        >
            <Head title={`Taking: ${quiz.title}`} />

            {/* Anti-cheat warning overlay */}
            {warningVisible && (
                <div className="fixed inset-0 z-50 bg-destructive/90 flex items-center justify-center">
                    <div className="text-center text-white">
                        <AlertTriangle className="mx-auto h-16 w-16 mb-4" />
                        <h2 className="text-2xl font-bold mb-2">Tab Switch Detected!</h2>
                        <p>Please stay on this page during the exam.</p>
                        <p className="mt-2 text-sm opacity-80">This event has been logged.</p>
                    </div>
                </div>
            )}

            <div className="py-12">
                <div className="mx-auto max-w-4xl sm:px-6 lg:px-8">
                    <form onSubmit={confirmSubmit}>
                        <div className="space-y-8">
                            {(() => {
                                const typeOrder = ['multiple_choice', 'true_false', 'identification', 'coding', 'essay'];
                                const typeLabels: Record<string, string> = {
                                    multiple_choice: 'Multiple Choice',
                                    true_false: 'True / False',
                                    identification: 'Identification',
                                    coding: 'Coding',
                                    essay: 'Essay',
                                };
                                const typeIcons: Record<string, React.ReactNode> = {
                                    multiple_choice: <CheckSquare className="h-5 w-5" />,
                                    true_false: <ToggleLeft className="h-5 w-5" />,
                                    identification: <HelpCircle className="h-5 w-5" />,
                                    coding: <Code className="h-5 w-5" />,
                                    essay: <FileText className="h-5 w-5" />,
                                };
                                const questions = quiz.questions || [];

                                return typeOrder
                                    .filter((type) => questions.some((q) => q.type === type))
                                    .map((type) => {
                                        const questionsOfType = questions.filter((q) => q.type === type);
                                        return (
                                            <div key={type} className="space-y-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="text-muted-foreground">{typeIcons[type]}</div>
                                                    <h3 className="font-medium text-foreground">{typeLabels[type]}</h3>
                                                    <Badge variant="outline">{questionsOfType.length}</Badge>
                                                </div>
                                                <div className="space-y-4 pl-7">
                                                    {questionsOfType.map((question, typeIndex) => (
                                                        <QuestionRenderer
                                                            key={question.id}
                                                            question={question}
                                                            index={typeIndex}
                                                            value={answers[question.id] || ''}
                                                            onChange={(value) => setAnswer(question.id, value)}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    });
                            })()}
                        </div>

                        <div className="mt-8 flex justify-end">
                            <Button type="submit" size="lg" disabled={submitting}>
                                <Send className="mr-2 h-4 w-4" />
                                {submitting ? 'Submitting...' : 'Submit Exam'}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
