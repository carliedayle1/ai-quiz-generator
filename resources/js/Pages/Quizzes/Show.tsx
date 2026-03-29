import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { PageProps, Question, Quiz, fullName } from '@/types';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { Link } from '@inertiajs/react';
import { CheckCircle, CheckSquare, Code, Eye, EyeOff, FileText, HelpCircle, ToggleLeft } from 'lucide-react';

export default function Show({ quiz, isTeacher }: PageProps<{ quiz: Quiz; isTeacher: boolean }>) {
    const togglePublish = () => {
        if (quiz.is_published) {
            router.post(route('quizzes.unpublish', quiz.id));
        } else {
            router.post(route('quizzes.publish', quiz.id));
        }
    };

    const questionTypeLabels: Record<string, string> = {
        multiple_choice: 'Multiple Choice',
        true_false: 'True / False',
        identification: 'Identification',
        coding: 'Coding',
        essay: 'Essay',
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold leading-tight text-foreground">
                            {quiz.title}
                        </h2>
                        {quiz.description && (
                            <p className="mt-1 text-sm text-muted-foreground">{quiz.description}</p>
                        )}
                    </div>
                    {isTeacher && (
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={togglePublish}>
                                {quiz.is_published ? (
                                    <>
                                        <EyeOff className="mr-2 h-4 w-4" /> Unpublish
                                    </>
                                ) : (
                                    <>
                                        <Eye className="mr-2 h-4 w-4" /> Publish
                                    </>
                                )}
                            </Button>
                        </div>
                    )}
                </div>
            }
        >
            <Head title={quiz.title} />

            <div className="py-12">
                <div className="mx-auto max-w-4xl sm:px-6 lg:px-8 space-y-6">
                    {/* Quiz Info */}
                    <div className="flex gap-4 text-sm text-muted-foreground">
                        <Badge variant={quiz.is_published ? 'default' : 'secondary'}>
                            {quiz.is_published ? 'Published' : 'Draft'}
                        </Badge>
                        {quiz.time_limit && <span>Time limit: {quiz.time_limit} min</span>}
                        <span>{quiz.questions?.length || 0} questions</span>
                        <span>
                            {quiz.questions?.reduce((s, q) => s + q.points, 0) || 0} total points
                        </span>
                    </div>

                    {/* Questions grouped by type */}
                    {isTeacher && quiz.questions && (() => {
                        const typeOrder = ['multiple_choice', 'true_false', 'identification', 'coding', 'essay'];
                        const typeIcons: Record<string, React.ReactNode> = {
                            multiple_choice: <CheckSquare className="h-5 w-5" />,
                            true_false: <ToggleLeft className="h-5 w-5" />,
                            identification: <HelpCircle className="h-5 w-5" />,
                            coding: <Code className="h-5 w-5" />,
                            essay: <FileText className="h-5 w-5" />,
                        };

                        return (
                            <div className="space-y-6">
                                <h3 className="text-lg font-medium text-foreground">Questions</h3>
                                {typeOrder
                                    .filter((type) => quiz.questions!.some((q) => q.type === type))
                                    .map((type) => {
                                        const questionsOfType = quiz.questions!.filter((q) => q.type === type);
                                        return (
                                            <div key={type} className="space-y-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="text-muted-foreground">{typeIcons[type]}</div>
                                                    <h4 className="font-medium text-foreground">
                                                        {questionTypeLabels[type]}
                                                    </h4>
                                                    <Badge variant="outline">{questionsOfType.length}</Badge>
                                                    <span className="text-sm text-muted-foreground">
                                                        {questionsOfType.reduce((s, q) => s + q.points, 0)} pts
                                                    </span>
                                                </div>

                                                <div className="space-y-3 pl-7">
                                                    {questionsOfType.map((q, typeIndex) => (
                                                        <Card key={q.id}>
                                                            <CardContent className="pt-4 pb-4">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <span className="text-sm font-medium text-muted-foreground">
                                                                        {typeIndex + 1}.
                                                                    </span>
                                                                    <span className="text-sm text-muted-foreground">
                                                                        {q.points} pt{q.points !== 1 ? 's' : ''}
                                                                    </span>
                                                                </div>
                                                                <p className="text-foreground">{q.content.question}</p>

                                                                {q.type === 'multiple_choice' && q.content.options && (
                                                                    <ul className="mt-2 space-y-1">
                                                                        {q.content.options.map((opt: string, i: number) => (
                                                                            <li
                                                                                key={i}
                                                                                className={`text-sm pl-4 ${opt === q.content.correct_answer ? 'text-green-600 dark:text-green-400 font-medium' : 'text-muted-foreground'}`}
                                                                            >
                                                                                {String.fromCharCode(65 + i)}. {opt}
                                                                                {opt === q.content.correct_answer && ' ✓'}
                                                                            </li>
                                                                        ))}
                                                                    </ul>
                                                                )}

                                                                {q.type === 'true_false' && (
                                                                    <p className="mt-1 text-sm text-green-600 dark:text-green-400">
                                                                        Answer: {q.content.correct_answer ? 'True' : 'False'}
                                                                    </p>
                                                                )}

                                                                {q.type === 'identification' && q.content.correct_answers && (
                                                                    <p className="mt-1 text-sm text-green-600 dark:text-green-400">
                                                                        Answers: {q.content.correct_answers.join(', ')}
                                                                    </p>
                                                                )}

                                                                {q.type === 'coding' && (
                                                                    <p className="mt-1 text-sm text-muted-foreground">
                                                                        Language: {q.content.language || 'Any'}
                                                                    </p>
                                                                )}

                                                                {q.type === 'essay' && q.content.grading_rubric && (
                                                                    <p className="mt-1 text-sm text-muted-foreground">
                                                                        Rubric: {q.content.grading_rubric}
                                                                    </p>
                                                                )}
                                                            </CardContent>
                                                        </Card>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                            </div>
                        );
                    })()}

                    {/* Submissions (teacher view) */}
                    {isTeacher && quiz.submissions && quiz.submissions.length > 0 && (
                        <div>
                            <h3 className="text-lg font-medium text-foreground mb-4">
                                Submissions ({quiz.submissions.length})
                            </h3>
                            <Card>
                                <CardContent className="p-0">
                                    <div className="divide-y divide-border">
                                        {quiz.submissions.map((sub) => (
                                            <Link
                                                key={sub.id}
                                                href={route('submissions.result', sub.id)}
                                                className="flex items-center justify-between px-6 py-3 hover:bg-accent transition-colors"
                                            >
                                                <div>
                                                    <p className="text-sm font-medium text-foreground">
                                                        {sub.student ? fullName(sub.student) : 'Unknown'}
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {sub.student?.email}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {sub.submitted_at ? (
                                                        <>
                                                            <Badge variant={sub.score !== null && sub.score >= 70 ? 'default' : 'destructive'}>
                                                                {sub.score !== null ? `${sub.score}%` : 'Pending'}
                                                            </Badge>
                                                            <CheckCircle className="h-4 w-4 text-green-500" />
                                                        </>
                                                    ) : (
                                                        <Badge variant="secondary">In Progress</Badge>
                                                    )}
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
