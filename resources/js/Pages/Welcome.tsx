import ApplicationLogo from '@/Components/ApplicationLogo';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import ThemeToggle from '@/Components/ThemeToggle';
import { Head, Link } from '@inertiajs/react';
import {
    Brain,
    Zap,
    Shield,
    CheckCircle,
    ArrowRight,
    Sparkles,
    Users,
    FileText,
} from 'lucide-react';

export default function Welcome({
    auth,
}: {
    auth: { user: { name: string } | null };
}) {
    return (
        <>
            <Head title="Welcome" />

            <div className="min-h-screen bg-background">
                {/* Nav */}
                <nav className="border-b-3 border-foreground bg-card">
                    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                        <div className="flex h-16 items-center justify-between">
                            <div className="flex items-center gap-3">
                                <ApplicationLogo className="h-10 w-10" />
                                <span className="font-extrabold text-xl tracking-tight">
                                    QuizAI
                                </span>
                            </div>
                            <div className="flex items-center gap-3">
                                <ThemeToggle />
                                {auth.user ? (
                                    <Link href={route('dashboard')}>
                                        <Button variant="default" size="sm">
                                            Dashboard
                                        </Button>
                                    </Link>
                                ) : (
                                    <>
                                        <Link href={route('login')}>
                                            <Button variant="outline" size="sm">
                                                Login
                                            </Button>
                                        </Link>
                                        <Link href={route('register')}>
                                            <Button variant="default" size="sm">
                                                Get Started
                                            </Button>
                                        </Link>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </nav>

                {/* Hero */}
                <section className="border-b-3 border-foreground bg-secondary">
                    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
                        <div className="flex flex-col items-center text-center">
                            <div className="inline-flex items-center gap-2 border-3 border-foreground bg-card px-4 py-1.5 shadow-brutal-sm font-bold text-sm uppercase tracking-wide mb-6">
                                <Sparkles className="h-4 w-4" />
                                Powered by AI
                            </div>
                            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-secondary-foreground max-w-4xl">
                                Generate Quizzes in Seconds, Not Hours
                            </h1>
                            <p className="mt-6 text-lg sm:text-xl max-w-2xl text-secondary-foreground/80">
                                The AI-powered quiz platform for teachers. Create, manage, and
                                auto-grade exams with multiple question types. Your students
                                get instant results.
                            </p>
                            <div className="mt-10 flex flex-wrap gap-4 justify-center">
                                {!auth.user && (
                                    <>
                                        <Link href={route('register')}>
                                            <Button size="lg" className="text-base gap-2">
                                                Start Creating Quizzes
                                                <ArrowRight className="h-5 w-5" />
                                            </Button>
                                        </Link>
                                        <Link href={route('login')}>
                                            <Button
                                                variant="outline"
                                                size="lg"
                                                className="text-base"
                                            >
                                                Sign In
                                            </Button>
                                        </Link>
                                    </>
                                )}
                                {auth.user && (
                                    <Link href={route('dashboard')}>
                                        <Button size="lg" className="text-base gap-2">
                                            Go to Dashboard
                                            <ArrowRight className="h-5 w-5" />
                                        </Button>
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features */}
                <section className="border-b-3 border-foreground">
                    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                                Everything You Need
                            </h2>
                            <p className="mt-3 text-lg text-muted-foreground">
                                A complete toolkit for modern assessment
                            </p>
                        </div>
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                            <Card className="border-l-[6px] border-l-primary">
                                <CardHeader className="pb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center border-3 border-foreground bg-primary shadow-brutal-sm">
                                            <Brain className="h-5 w-5 text-primary-foreground" />
                                        </div>
                                        <CardTitle className="text-lg">AI Generation</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground">
                                        Enter a topic and let AI create diverse questions
                                        instantly. Choose difficulty levels and question types.
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="border-l-[6px] border-l-secondary">
                                <CardHeader className="pb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center border-3 border-foreground bg-secondary shadow-brutal-sm">
                                            <FileText className="h-5 w-5 text-secondary-foreground" />
                                        </div>
                                        <CardTitle className="text-lg">5 Question Types</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground">
                                        Multiple choice, true/false, identification, coding, and
                                        essay questions all in one quiz.
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="border-l-[6px] border-l-accent">
                                <CardHeader className="pb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center border-3 border-foreground bg-accent shadow-brutal-sm">
                                            <Shield className="h-5 w-5 text-accent-foreground" />
                                        </div>
                                        <CardTitle className="text-lg">Anti-Cheat</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground">
                                        Tab-switching detection, window blur monitoring, and
                                        real-time suspicious activity logging.
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="border-l-[6px] border-l-success">
                                <CardHeader className="pb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center border-3 border-foreground bg-success shadow-brutal-sm">
                                            <Zap className="h-5 w-5 text-success-foreground" />
                                        </div>
                                        <CardTitle className="text-lg">Instant Grading</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground">
                                        Automatic scoring for objective questions. Students see
                                        results immediately after submission.
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </section>

                {/* How It Works */}
                <section className="border-b-3 border-foreground bg-muted">
                    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                                How It Works
                            </h2>
                        </div>
                        <div className="grid gap-8 sm:grid-cols-3">
                            {[
                                {
                                    step: '01',
                                    title: 'Create a Class',
                                    desc: 'Set up your class and share the invite code with your students. They join with one click.',
                                    icon: Users,
                                    color: 'bg-primary text-primary-foreground',
                                },
                                {
                                    step: '02',
                                    title: 'Generate a Quiz',
                                    desc: 'Enter your topic, pick question types and difficulty. AI generates a complete quiz in seconds.',
                                    icon: Brain,
                                    color: 'bg-secondary text-secondary-foreground',
                                },
                                {
                                    step: '03',
                                    title: 'Publish & Grade',
                                    desc: 'Publish the quiz for students. Answers are auto-graded and results appear instantly.',
                                    icon: CheckCircle,
                                    color: 'bg-success text-success-foreground',
                                },
                            ].map((item) => (
                                <div key={item.step} className="flex flex-col items-center text-center">
                                    <div className={`flex h-16 w-16 items-center justify-center border-3 border-foreground shadow-brutal ${item.color}`}>
                                        <item.icon className="h-8 w-8" />
                                    </div>
                                    <div className="mt-4 inline-flex items-center justify-center border-3 border-foreground bg-card px-3 py-1 font-extrabold text-sm shadow-brutal-sm">
                                        Step {item.step}
                                    </div>
                                    <h3 className="mt-4 text-xl font-bold">{item.title}</h3>
                                    <p className="mt-2 text-sm text-muted-foreground max-w-xs">
                                        {item.desc}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* CTA */}
                <section className="bg-primary">
                    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 text-center">
                        <h2 className="text-3xl sm:text-4xl font-extrabold text-primary-foreground tracking-tight">
                            Ready to Transform Your Assessments?
                        </h2>
                        <p className="mt-4 text-lg text-primary-foreground/80 max-w-xl mx-auto">
                            Join teachers who are saving hours on quiz creation and grading.
                        </p>
                        {!auth.user && (
                            <div className="mt-8">
                                <Link href={route('register')}>
                                    <Button
                                        variant="secondary"
                                        size="lg"
                                        className="text-base gap-2"
                                    >
                                        Get Started Free
                                        <ArrowRight className="h-5 w-5" />
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </div>
                </section>

                {/* Footer */}
                <footer className="border-t-3 border-foreground bg-card">
                    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-2">
                                <ApplicationLogo className="h-8 w-8" />
                                <span className="font-extrabold tracking-tight">
                                    QuizAI
                                </span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Built with Laravel, React & Groq AI
                            </p>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}
