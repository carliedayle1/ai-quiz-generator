import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { ClassModel, PageProps, fullName } from '@/types';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { BookOpen, Copy, Plus, Trash2, Users } from 'lucide-react';
import { useState } from 'react';

export default function Show({ classData }: PageProps<{ classData: ClassModel }>) {
    const { auth } = usePage<PageProps>().props;
    const isTeacher = auth.user.role === 'teacher';
    const [copied, setCopied] = useState(false);

    const copyInviteCode = () => {
        navigator.clipboard.writeText(classData.invite_code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const deleteClass = () => {
        if (confirm('Are you sure you want to delete this class? This cannot be undone.')) {
            router.delete(route('classes.destroy', classData.id));
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                        <h2 className="text-xl font-bold leading-tight text-foreground">
                            {classData.name}
                        </h2>
                        {classData.description && (
                            <p className="mt-1 text-sm text-muted-foreground">{classData.description}</p>
                        )}
                    </div>
                    {isTeacher && (
                        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                            <Button variant="outline" onClick={copyInviteCode}>
                                <Copy className="mr-2 h-4 w-4" />
                                {copied ? 'Copied!' : classData.invite_code}
                            </Button>
                            <Link href={route('quizzes.create', classData.id)}>
                                <Button>
                                    <Plus className="mr-2 h-4 w-4" /> New Quiz
                                </Button>
                            </Link>
                            <Button variant="destructive" size="icon" onClick={deleteClass}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    )}
                </div>
            }
        >
            <Head title={classData.name} />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8 space-y-6">
                    {/* Quizzes */}
                    <div>
                        <h3 className="text-lg font-medium text-foreground mb-4">Quizzes</h3>
                        {classData.quizzes && classData.quizzes.length > 0 ? (
                            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                                {classData.quizzes.map((quiz) => (
                                    <Link
                                        key={quiz.id}
                                        href={isTeacher ? route('quizzes.show', quiz.id) : (quiz.is_published && (!quiz.available_from || new Date(quiz.available_from) <= new Date()) ? route('quizzes.take', quiz.id) : '#')}
                                    >
                                        <Card className="hover:shadow-brutal transition-shadow cursor-pointer">
                                            <CardHeader>
                                                <div className="flex items-center justify-between">
                                                    <CardTitle className="text-lg">{quiz.title}</CardTitle>
                                                    {isTeacher ? (
                                                        <Badge variant={quiz.is_published ? 'default' : 'secondary'}>
                                                            {quiz.is_published ? 'Published' : 'Draft'}
                                                        </Badge>
                                                    ) : (
                                                        quiz.available_from && new Date(quiz.available_from) > new Date() ? (
                                                            <Badge variant="secondary">
                                                                Opens {new Date(quiz.available_from).toLocaleDateString()}
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant={quiz.is_published ? 'default' : 'secondary'}>
                                                                {quiz.is_published ? 'Available' : 'Not yet open'}
                                                            </Badge>
                                                        )
                                                    )}
                                                </div>
                                                {quiz.description && (
                                                    <CardDescription>{quiz.description}</CardDescription>
                                                )}
                                            </CardHeader>
                                            <CardContent>
                                                <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                                                    {quiz.questions && (
                                                        <Badge variant="outline" className="text-xs">
                                                            {quiz.questions.length} item{quiz.questions.length !== 1 ? 's' : ''}
                                                        </Badge>
                                                    )}
                                                    {quiz.time_limit && (
                                                        <Badge variant="outline" className="text-xs">
                                                            {quiz.time_limit} min
                                                        </Badge>
                                                    )}
                                                    {quiz.questions && (() => {
                                                        const typeCounts = quiz.questions.reduce((acc, q) => {
                                                            acc[q.type] = (acc[q.type] || 0) + 1;
                                                            return acc;
                                                        }, {} as Record<string, number>);
                                                        return Object.entries(typeCounts).map(([type, count]) => (
                                                            <Badge key={type} variant="secondary" className="text-xs">
                                                                {count} {type.replace(/_/g, ' ')}
                                                            </Badge>
                                                        ));
                                                    })()}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <BookOpen className="mx-auto h-8 w-8 text-muted-foreground" />
                                <p className="mt-2 text-sm text-muted-foreground">
                                    {isTeacher ? 'No quizzes yet. Create one to get started!' : 'No quizzes available yet.'}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Students (teacher only) */}
                    {isTeacher && classData.students && (
                        <div>
                            <h3 className="text-lg font-medium text-foreground mb-4">
                                <Users className="inline h-5 w-5 mr-2" />
                                Students ({classData.students.length})
                            </h3>
                            {classData.students.length > 0 ? (
                                <Card>
                                    <CardContent className="p-0">
                                        <div className="divide-y divide-border">
                                            {classData.students.map((student) => (
                                                <div key={student.id} className="flex items-center justify-between px-6 py-3">
                                                    <div>
                                                        <p className="text-sm font-medium text-foreground">{fullName(student)}</p>
                                                        <p className="text-sm text-muted-foreground">{student.email}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            ) : (
                                <p className="text-sm text-muted-foreground">
                                    No students have joined yet. Share the invite code: <Badge variant="outline" className="font-mono">{classData.invite_code}</Badge>
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
