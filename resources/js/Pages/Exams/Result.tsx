import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage } from '@inertiajs/react';
import { PageProps, Submission, fullName } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { useState } from 'react';
import axios from 'axios';

export default function Result({ submission: initialSubmission }: PageProps<{ submission: Submission }>) {
    const { auth } = usePage<PageProps>().props;
    const isTeacher = auth.user.role === 'teacher';
    const [submission, setSubmission] = useState(initialSubmission);
    const quiz = submission.quiz!;
    const questions = quiz.questions || [];
    const answers = submission.answers || {};
    const manualGrades: Record<number, number> = (submission as any).manual_grades || {};

    // Per-question grading state for teacher
    const [gradingValues, setGradingValues] = useState<Record<number, string>>(() => {
        const init: Record<number, string> = {};
        for (const [id, pts] of Object.entries(manualGrades)) {
            init[Number(id)] = String(pts);
        }
        return init;
    });
    const [savingGrade, setSavingGrade] = useState<Record<number, boolean>>({});

    const saveGrade = async (questionId: number, maxPoints: number) => {
        const raw = gradingValues[questionId] ?? '';
        const pts = Math.max(0, Math.min(maxPoints, parseFloat(raw) || 0));
        setSavingGrade((prev) => ({ ...prev, [questionId]: true }));
        try {
            const resp = await axios.post(route('submissions.grade-question', submission.id), {
                question_id: questionId,
                points_awarded: pts,
            });
            setSubmission((prev) => ({
                ...prev,
                score: resp.data.score,
                earned_points: resp.data.earned_points,
                manual_grades: resp.data.manual_grades,
            } as any));
        } catch {
            // silently ignore
        } finally {
            setSavingGrade((prev) => ({ ...prev, [questionId]: false }));
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold leading-tight text-foreground">
                            {isTeacher
                                ? `${submission.student ? fullName(submission.student) : 'Unknown'}'s Submission`
                                : 'Your Results'}
                        </h2>
                        <p className="text-sm text-muted-foreground mt-1">{quiz.title}</p>
                    </div>
                    <div className="text-right">
                        {submission.earned_points !== null && submission.total_points !== null && (
                            <div className="text-3xl font-bold text-foreground">
                                {submission.earned_points}/{submission.total_points}
                            </div>
                        )}
                        <div className={`font-bold text-foreground ${submission.earned_points !== null ? 'text-lg text-muted-foreground' : 'text-3xl'}`}>
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

                        const needsManualGrading = question.type === 'coding' || question.type === 'essay';
                        const awardedPoints = manualGrades[question.id] ?? null;

                        return (
                            <Card key={question.id}>
                                <CardContent className="pt-6 space-y-3">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium text-muted-foreground">Q{index + 1}.</span>
                                        <Badge variant="outline">{question.type.replace('_', ' ')}</Badge>
                                        <span className="text-sm text-muted-foreground">{question.points} pts</span>
                                        {needsManualGrading && awardedPoints !== null && (
                                            <Badge variant="secondary" className="ml-auto">
                                                {awardedPoints}/{question.points} pts
                                            </Badge>
                                        )}
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
                                            {isTeacher ? 'Student answer:' : 'Your answer:'}{' '}
                                            <span className="text-foreground whitespace-pre-wrap">{answer || '(no answer)'}</span>
                                        </p>
                                        {isCorrect === false && !needsManualGrading && (
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

                                        {needsManualGrading && (
                                            isTeacher ? (
                                                <div className="mt-3 flex items-center gap-2">
                                                    <span className="text-muted-foreground text-xs">Award points (0–{question.points}):</span>
                                                    <Input
                                                        type="number"
                                                        min={0}
                                                        max={question.points}
                                                        step={0.5}
                                                        value={gradingValues[question.id] ?? (awardedPoints !== null ? String(awardedPoints) : '')}
                                                        onChange={(e) =>
                                                            setGradingValues((prev) => ({ ...prev, [question.id]: e.target.value }))
                                                        }
                                                        className="h-7 w-20 text-sm"
                                                    />
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="h-7 text-xs"
                                                        disabled={savingGrade[question.id]}
                                                        onClick={() => saveGrade(question.id, question.points)}
                                                    >
                                                        {savingGrade[question.id] ? 'Saving…' : 'Save'}
                                                    </Button>
                                                </div>
                                            ) : (
                                                <p className="text-muted-foreground mt-1 italic">
                                                    {awardedPoints !== null
                                                        ? `Graded: ${awardedPoints}/${question.points} pts`
                                                        : 'Awaiting manual grading.'}
                                                </p>
                                            )
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
