import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, usePage } from '@inertiajs/react';
import { ClassModel, PageProps } from '@/types';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Textarea } from '@/Components/ui/textarea';
import { Badge } from '@/Components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/Components/ui/dialog';
import { Link } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';
import { BookOpen, Plus, Users } from 'lucide-react';

export default function Index({ classes }: PageProps<{ classes: ClassModel[] }>) {
    const { auth } = usePage<PageProps>().props;
    const isTeacher = auth.user.role === 'teacher';

    const [createOpen, setCreateOpen] = useState(false);
    const [joinOpen, setJoinOpen] = useState(false);

    const createForm = useForm({ name: '', description: '' });
    const joinForm = useForm({ invite_code: '' });

    const submitCreate: FormEventHandler = (e) => {
        e.preventDefault();
        createForm.post(route('classes.store'), {
            onSuccess: () => {
                setCreateOpen(false);
                createForm.reset();
            },
        });
    };

    const submitJoin: FormEventHandler = (e) => {
        e.preventDefault();
        joinForm.post(route('classes.join'), {
            onSuccess: () => {
                setJoinOpen(false);
                joinForm.reset();
            },
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-foreground">
                        My Classes
                    </h2>
                    <div className="flex gap-2">
                        {isTeacher ? (
                            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                                <DialogTrigger asChild>
                                    <Button>
                                        <Plus className="mr-2 h-4 w-4" /> Create Class
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <form onSubmit={submitCreate}>
                                        <DialogHeader>
                                            <DialogTitle>Create a New Class</DialogTitle>
                                            <DialogDescription>
                                                Create a class and share the invite code with your students.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="grid gap-4 py-4">
                                            <div className="grid gap-2">
                                                <Label htmlFor="name">Class Name</Label>
                                                <Input
                                                    id="name"
                                                    value={createForm.data.name}
                                                    onChange={(e) => createForm.setData('name', e.target.value)}
                                                    placeholder="e.g., Computer Science 101"
                                                />
                                                {createForm.errors.name && (
                                                    <p className="text-sm text-destructive">{createForm.errors.name}</p>
                                                )}
                                            </div>
                                            <div className="grid gap-2">
                                                <Label htmlFor="description">Description (optional)</Label>
                                                <Textarea
                                                    id="description"
                                                    value={createForm.data.description}
                                                    onChange={(e) => createForm.setData('description', e.target.value)}
                                                    placeholder="Brief description of the class..."
                                                />
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button type="submit" disabled={createForm.processing}>
                                                Create Class
                                            </Button>
                                        </DialogFooter>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        ) : (
                            <Dialog open={joinOpen} onOpenChange={setJoinOpen}>
                                <DialogTrigger asChild>
                                    <Button>
                                        <Plus className="mr-2 h-4 w-4" /> Join Class
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <form onSubmit={submitJoin}>
                                        <DialogHeader>
                                            <DialogTitle>Join a Class</DialogTitle>
                                            <DialogDescription>
                                                Enter the invite code provided by your teacher.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="grid gap-4 py-4">
                                            <div className="grid gap-2">
                                                <Label htmlFor="invite_code">Invite Code</Label>
                                                <Input
                                                    id="invite_code"
                                                    value={joinForm.data.invite_code}
                                                    onChange={(e) => joinForm.setData('invite_code', e.target.value.toUpperCase())}
                                                    placeholder="e.g., ABCD1234"
                                                    maxLength={8}
                                                />
                                                {joinForm.errors.invite_code && (
                                                    <p className="text-sm text-destructive">{joinForm.errors.invite_code}</p>
                                                )}
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button type="submit" disabled={joinForm.processing}>
                                                Join Class
                                            </Button>
                                        </DialogFooter>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        )}
                    </div>
                </div>
            }
        >
            <Head title="Classes" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    {classes.length === 0 ? (
                        <div className="text-center py-12">
                            <BookOpen className="mx-auto h-12 w-12 text-muted-foreground" />
                            <h3 className="mt-2 text-sm font-semibold text-foreground">No classes</h3>
                            <p className="mt-1 text-sm text-muted-foreground">
                                {isTeacher
                                    ? 'Get started by creating a new class.'
                                    : 'Join a class using an invite code from your teacher.'}
                            </p>
                        </div>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {classes.map((cls) => (
                                <Link key={cls.id} href={route('classes.show', cls.id)}>
                                    <Card className="hover:shadow-md transition-shadow cursor-pointer">
                                        <CardHeader>
                                            <CardTitle className="text-lg">{cls.name}</CardTitle>
                                            {cls.description && (
                                                <CardDescription>{cls.description}</CardDescription>
                                            )}
                                        </CardHeader>
                                        <CardContent>
                                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                {isTeacher && (
                                                    <>
                                                        <div className="flex items-center gap-1">
                                                            <Users className="h-4 w-4" />
                                                            {cls.students_count} students
                                                        </div>
                                                        <Badge variant="outline" className="font-mono">
                                                            {cls.invite_code}
                                                        </Badge>
                                                    </>
                                                )}
                                                <div className="flex items-center gap-1">
                                                    <BookOpen className="h-4 w-4" />
                                                    {cls.quizzes_count} quizzes
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
