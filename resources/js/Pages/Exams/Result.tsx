import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage } from '@inertiajs/react';
import { PageProps, Submission } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

export default function Result({ submission }: PageProps<{ submission: Submission }>) {
    const { auth } = usePage<PageProps>().props;
    const isTeacher = auth.user.role === 'teacher';
    const quiz = submission.quiz!;
    const questions = quiz.questions || [];
    const answers = submission.answers || {};

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-semibold leading-tight text-foreground">
                            {isTeacher ? `${submission.student?.name}'s Submission` : 'Your Results'}
                        </h2>
                        <p className="text-sm text-muted-foreground mt-1">{quiz.title}</p>
                    </div>
                    <div className="text-right">
                        <div className="text-3xl font-bold text-foreground">
                            {submission.score !== null ? `${submission.score}%` : 'Pending'}
                        </div>
                    </div>
                </div>
            }
        >
            <Head title="Exam Results" />

            <div className="py-12">
                <div className="mx-auto max-w-4xl sm:px-6 lg:px-8 space-y-6">
                    {/* Anti-cheat log summary */}
                    {isTeacher && submission.exam_logs && submission.exam_logs.length > 0 && (
                        <Card className="border-destructive/50">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-destructive">
                                    <AlertTriangle className="h-5 w-5" />
                                    Anti-Cheat Log ({submission.exam_logs.length} events)
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {submission.exam_logs.map((log) => (
                                        <div key={log.id} className="flex items-center justify-between text-sm">
                                            <span className="text-foreground">{log.event_type}</span>
                                            <span className="text-muted-foreground">
                                                {new Date(log.created_at).toLocaleTimeString()}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Questions and answers */}
                    {questions.map((question, index) => {
                        const answer = answers[question.id];
                        let isCorrect: boolean | null = null;

                        if (question.type === 'multiple_choice') {
                            isCorrect = answer === question.content.correct_answer;
                        } else if (question.type === 'true_false') {
                            isCorrect = String(question.content.correct_answer) === answer;
                        } else if (question.type === 'identification') {
                            const acceptable = (question.content.correct_answers || []).map((a: string) => a.toLowerCase().trim());
                            isCorrect = acceptable.includes((answer || '').toLowerCase().trim());
                        }

                        return (
                            <Card key={question.id}>
                                <CardContent className="pt-6 space-y-3">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium text-muted-foreground">Q{index + 1}.</span>
                                        <Badge variant="outline">{question.type.replace('_', ' ')}</Badge>
                                        <span className="text-sm text-muted-foreground">{question.points} pts</span>
                                        {isCorrect !== null && (
                                            <span className="ml-auto">
                                                {isCorrect ? (
                                                    <CheckCircle className="h-5 w-5 text-green-500" />
                                                ) : (
                                                    <XCircle className="h-5 w-5 text-destructive" />
                                                )}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-foreground font-medium">{question.content.question}</p>

                                    <div className="text-sm">
                                        <p className="text-muted-foreground">
                                            Your answer: <span className="text-foreground">{answer || '(no answer)'}</span>
                                        </p>
                                        {isCorrect === false && (
                                            <p className="text-green-600 dark:text-green-400 mt-1">
                                                Correct answer: {
                                                    question.type === 'multiple_choice'
                                                        ? question.content.correct_answer
                                                        : question.type === 'true_false'
                                                            ? String(question.content.correct_answer)
                                                            : question.content.correct_answers?.join(', ')
                                                }
                                            </p>
                                        )}
                                        {(question.type === 'coding' || question.type === 'essay') && (
                                            <p className="text-muted-foreground mt-1 italic">
                                                This question requires manual grading.
                                            </p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
