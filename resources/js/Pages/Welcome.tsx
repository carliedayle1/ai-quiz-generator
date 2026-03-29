import ApplicationLogo from '@/Components/ApplicationLogo';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import ThemeToggle from '@/Components/ThemeToggle';
import { Head, Link } from '@inertiajs/react';
import {
    ArrowRight,
    BarChart3,
    Bell,
    BookOpen,
    Brain,
    CheckCircle,
    Clock,
    Code2,
    Copy,
    FileText,
    Globe,
    GraduationCap,
    Layers,
    Printer,
    Share2,
    Shield,
    Sparkles,
    Upload,
    Users,
    Zap,
} from 'lucide-react';

export default function Welcome({ auth }: { auth: { user: { name: string } | null } }) {
    return (
        <>
            <Head title="Welcome" />

            <div className="min-h-screen bg-background">

                {/* ── Nav ─────────────────────────────────────────────────────── */}
                <nav className="border-b-3 border-foreground bg-card sticky top-0 z-40">
                    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                        <div className="flex h-16 items-center justify-between">
                            <div className="flex items-center gap-3">
                                <ApplicationLogo className="h-10 w-10" />
                                <span className="font-extrabold text-xl tracking-tight">QuizAI</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <ThemeToggle />
                                {auth.user ? (
                                    <Link href={route('dashboard')}>
                                        <Button variant="default" size="sm">Dashboard</Button>
                                    </Link>
                                ) : (
                                    <>
                                        <Link href={route('login')}>
                                            <Button variant="outline" size="sm">Login</Button>
                                        </Link>
                                        <Link href={route('register')}>
                                            <Button variant="default" size="sm">Get Started</Button>
                                        </Link>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </nav>

                {/* ── Hero ────────────────────────────────────────────────────── */}
                <section className="border-b-3 border-foreground bg-secondary">
                    <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
                        <div className="flex flex-col items-center text-center">
                            <div className="inline-flex items-center gap-2 border-3 border-foreground bg-card px-4 py-1.5 shadow-brutal-sm font-bold text-sm uppercase tracking-wide mb-6">
                                <Sparkles className="h-4 w-4" />
                                Powered by Groq AI
                            </div>
                            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold tracking-tight text-secondary-foreground max-w-4xl leading-none">
                                Quizzes Built by&nbsp;AI,<br />
                                <span className="underline decoration-4 underline-offset-4">Graded in Seconds</span>
                            </h1>
                            <p className="mt-6 text-lg sm:text-xl max-w-2xl text-secondary-foreground/80">
                                QuizAI is a full-featured LMS for teachers — generate exams from a topic
                                or a document, share them with your class, auto-grade responses, and
                                track performance with built-in analytics.
                            </p>
                            <div className="mt-10 flex flex-wrap gap-3 sm:gap-4 justify-center">
                                {!auth.user ? (
                                    <>
                                        <Link href={route('register')}>
                                            <Button size="lg" className="text-base gap-2">
                                                Start for Free <ArrowRight className="h-5 w-5" />
                                            </Button>
                                        </Link>
                                        <Link href={route('login')}>
                                            <Button variant="outline" size="lg" className="text-base">Sign In</Button>
                                        </Link>
                                    </>
                                ) : (
                                    <Link href={route('dashboard')}>
                                        <Button size="lg" className="text-base gap-2">
                                            Go to Dashboard <ArrowRight className="h-5 w-5" />
                                        </Button>
                                    </Link>
                                )}
                            </div>

                            {/* Stat pills */}
                            <div className="mt-14 flex flex-wrap justify-center gap-4">
                                {[
                                    { label: 'Question Types', value: '5' },
                                    { label: 'AI Generation Modes', value: '2' },
                                    { label: 'Auto-Graded', value: '100%' },
                                    { label: 'Anti-Cheat Logs', value: 'Real-time' },
                                ].map(s => (
                                    <div key={s.label} className="border-3 border-foreground bg-card shadow-brutal-sm px-5 py-3 text-center">
                                        <p className="text-2xl font-extrabold">{s.value}</p>
                                        <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── Core Feature Grid ───────────────────────────────────────── */}
                <section className="border-b-3 border-foreground">
                    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Everything in One Platform</h2>
                            <p className="mt-3 text-lg text-muted-foreground">
                                From quiz creation to gradebook export — no extra tools needed
                            </p>
                        </div>

                        <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                            {[
                                {
                                    icon: Brain,
                                    color: 'bg-primary text-primary-foreground',
                                    accent: 'border-l-primary',
                                    title: 'AI Quiz Generation',
                                    desc: 'Describe a topic, choose difficulty and question mix, and receive a complete quiz in seconds — powered by Groq\'s LLaMA model.',
                                    tags: ['Topic-based', 'Difficulty levels', 'Custom breakdown'],
                                },
                                {
                                    icon: Upload,
                                    color: 'bg-secondary text-secondary-foreground',
                                    accent: 'border-l-secondary',
                                    title: 'Context Engine',
                                    desc: 'Upload a PDF, Word doc, or text file. QuizAI reads it and either extracts existing exam questions or generates new ones from the material.',
                                    tags: ['PDF / TXT / MD', 'Extract or generate', 'Natural language instructions'],
                                },
                                {
                                    icon: Layers,
                                    color: 'bg-accent text-accent-foreground',
                                    accent: 'border-l-accent',
                                    title: '5 Question Types',
                                    desc: 'Build rich assessments with multiple choice, true/false, identification, essay, and coding questions — all in a single quiz.',
                                    tags: ['Multiple Choice', 'Coding w/ starter code', 'Essay'],
                                },
                                {
                                    icon: Zap,
                                    color: 'bg-success text-success-foreground',
                                    accent: 'border-l-success',
                                    title: 'Instant Auto-Grading',
                                    desc: 'Objective questions are scored the moment a student submits. Teachers manually review essays and coding answers. Partial credit supported.',
                                    tags: ['Auto-score', 'Partial credit', 'Manual review'],
                                },
                                {
                                    icon: Shield,
                                    color: 'bg-destructive text-destructive-foreground',
                                    accent: 'border-l-destructive',
                                    title: 'Anti-Cheat System',
                                    desc: 'Every exam session is monitored for tab switches, window blur events, and copy attempts. Flagged submissions are highlighted in analytics.',
                                    tags: ['Tab-switch detection', 'Real-time logs', 'Flag dashboard'],
                                },
                                {
                                    icon: BarChart3,
                                    color: 'bg-primary text-primary-foreground',
                                    accent: 'border-l-primary',
                                    title: 'Analytics & Gradebook',
                                    desc: 'View per-quiz submission counts, average scores, high/low scores, and pass rates. Export a full gradebook CSV with one click.',
                                    tags: ['Per-quiz stats', 'Pass rate', 'CSV export'],
                                },
                                {
                                    icon: Globe,
                                    color: 'bg-secondary text-secondary-foreground',
                                    accent: 'border-l-secondary',
                                    title: 'Global Quiz Bank',
                                    desc: 'Make any quiz public and share it with the entire teacher community. Browse, preview all questions, and copy quizzes to your own class.',
                                    tags: ['Public sharing', 'Preview questions', 'One-click copy'],
                                },
                                {
                                    icon: Share2,
                                    color: 'bg-accent text-accent-foreground',
                                    accent: 'border-l-accent',
                                    title: 'Peer-to-Peer Sharing',
                                    desc: 'Send a quiz directly to another teacher. They receive a notification and can accept (cloning it to their own class) or decline.',
                                    tags: ['Direct sharing', 'In-app notifications', 'Deep clone'],
                                },
                                {
                                    icon: Clock,
                                    color: 'bg-success text-success-foreground',
                                    accent: 'border-l-success',
                                    title: 'Scheduling & Deadlines',
                                    desc: 'Set an open window, a due date, or a time limit. Quizzes go live automatically and close themselves — no manual intervention needed.',
                                    tags: ['Available from/until', 'Due dates', 'Time limits'],
                                },
                            ].map(f => (
                                <Card key={f.title} className={`border-l-[6px] ${f.accent}`}>
                                    <CardHeader className="pb-3">
                                        <div className="flex items-center gap-3">
                                            <div className={`flex h-10 w-10 items-center justify-center border-3 border-foreground shadow-brutal-sm ${f.color}`}>
                                                <f.icon className="h-5 w-5" />
                                            </div>
                                            <CardTitle className="text-base">{f.title}</CardTitle>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <p className="text-sm text-muted-foreground">{f.desc}</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {f.tags.map(t => (
                                                <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── For Teachers / For Students ─────────────────────────────── */}
                <section className="border-b-3 border-foreground bg-muted">
                    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Built for Both Sides of the Classroom</h2>
                        </div>
                        <div className="grid gap-8 grid-cols-1 md:grid-cols-2">

                            {/* Teacher */}
                            <div className="border-3 border-foreground bg-card shadow-brutal p-6 space-y-5">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-12 w-12 items-center justify-center border-3 border-foreground bg-primary shadow-brutal-sm">
                                        <GraduationCap className="h-6 w-6 text-primary-foreground" />
                                    </div>
                                    <h3 className="text-xl font-extrabold">For Teachers</h3>
                                </div>
                                <ul className="space-y-3">
                                    {[
                                        { icon: Brain, text: 'Generate a full quiz from a topic or uploaded document in under 30 seconds' },
                                        { icon: Sparkles, text: 'Add individual AI-generated questions to any quiz directly in the editor' },
                                        { icon: FileText, text: 'Drag-and-drop question reordering, section headers, and preview mode' },
                                        { icon: Code2, text: 'Coding questions with optional starter code snippets for students' },
                                        { icon: Printer, text: 'Print-ready PDF layout generated automatically for in-person exams' },
                                        { icon: Copy, text: 'Clone quizzes from the Global Quiz Bank into any of your classes' },
                                        { icon: Share2, text: 'Share quizzes directly with colleague teachers via notifications' },
                                        { icon: BarChart3, text: 'Analytics dashboard with per-quiz performance breakdown and CSV export' },
                                        { icon: Bell, text: 'Notify students when quizzes open, close, or when they miss a deadline' },
                                    ].map(item => (
                                        <li key={item.text} className="flex items-start gap-3 text-sm">
                                            <item.icon className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                                            <span>{item.text}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Student */}
                            <div className="border-3 border-foreground bg-card shadow-brutal p-6 space-y-5">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-12 w-12 items-center justify-center border-3 border-foreground bg-secondary shadow-brutal-sm">
                                        <Users className="h-6 w-6 text-secondary-foreground" />
                                    </div>
                                    <h3 className="text-xl font-extrabold">For Students</h3>
                                </div>
                                <ul className="space-y-3">
                                    {[
                                        { icon: BookOpen, text: 'Join a class instantly with an 8-character invite code from your teacher' },
                                        { icon: Clock, text: 'Dashboard shows all upcoming quizzes with due dates and time limits' },
                                        { icon: CheckCircle, text: 'Clean, focused exam interface — one question at a time or all at once' },
                                        { icon: Code2, text: 'Coding questions with optional pre-filled starter code to build upon' },
                                        { icon: Zap, text: 'Instant score display with per-question breakdown after submission' },
                                        { icon: FileText, text: 'Review correct and incorrect answers once the exam is graded' },
                                        { icon: Bell, text: 'In-app notifications for quiz openings, study tips, and missed exams' },
                                        { icon: Shield, text: 'Fair assessment with transparent anti-cheat monitoring' },
                                        { icon: Printer, text: 'Print your graded result as a PDF for your own records' },
                                    ].map(item => (
                                        <li key={item.text} className="flex items-start gap-3 text-sm">
                                            <item.icon className="h-4 w-4 mt-0.5 text-secondary-foreground shrink-0" />
                                            <span>{item.text}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── How It Works ────────────────────────────────────────────── */}
                <section className="border-b-3 border-foreground">
                    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">From Zero to Published in Minutes</h2>
                            <p className="mt-3 text-lg text-muted-foreground">The full teacher workflow</p>
                        </div>
                        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
                            {[
                                { step: '01', icon: Users, color: 'bg-primary text-primary-foreground', title: 'Create a Class', desc: 'Set up your class and share the unique invite code with students.' },
                                { step: '02', icon: Brain, color: 'bg-secondary text-secondary-foreground', title: 'Generate a Quiz', desc: 'Type a topic or upload a document — AI builds the questions.' },
                                { step: '03', icon: Layers, color: 'bg-accent text-accent-foreground', title: 'Edit & Refine', desc: 'Drag questions, add sections, tweak wording, set a time limit.' },
                                { step: '04', icon: Clock, color: 'bg-success text-success-foreground', title: 'Schedule & Publish', desc: 'Set open/close windows or publish immediately.' },
                                { step: '05', icon: BarChart3, color: 'bg-primary text-primary-foreground', title: 'Review Results', desc: 'Scores appear instantly. Explore analytics or export a CSV.' },
                            ].map((item, i) => (
                                <div key={item.step} className="flex flex-col items-center text-center relative">
                                    {i < 4 && (
                                        <div className="hidden lg:block absolute top-8 left-[60%] w-[80%] border-t-3 border-dashed border-foreground/30" />
                                    )}
                                    <div className={`flex h-16 w-16 items-center justify-center border-3 border-foreground shadow-brutal z-10 ${item.color}`}>
                                        <item.icon className="h-8 w-8" />
                                    </div>
                                    <div className="mt-4 inline-flex items-center justify-center border-3 border-foreground bg-card px-3 py-1 font-extrabold text-sm shadow-brutal-sm">
                                        Step {item.step}
                                    </div>
                                    <h3 className="mt-3 text-base font-bold">{item.title}</h3>
                                    <p className="mt-1 text-xs text-muted-foreground max-w-[160px]">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── Feature Spotlights ──────────────────────────────────────── */}
                <section className="border-b-3 border-foreground bg-muted">
                    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 space-y-12">
                        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-center">Feature Spotlight</h2>

                        {/* AI Generation modes */}
                        <div className="grid gap-8 grid-cols-1 md:grid-cols-2 items-center">
                            <div className="space-y-4">
                                <div className="inline-flex items-center gap-2 border-3 border-foreground bg-primary text-primary-foreground px-3 py-1 shadow-brutal-sm font-bold text-xs uppercase tracking-wide">
                                    <Sparkles className="h-3.5 w-3.5" /> AI Generation
                                </div>
                                <h3 className="text-2xl font-extrabold">Two Modes, One Goal</h3>
                                <p className="text-muted-foreground">
                                    <strong>Standard Mode</strong> — enter a topic, pick your question type breakdown
                                    (e.g. 5 multiple choice + 3 identification + 2 essay), set the difficulty, and optionally
                                    attach a reference file. The AI generates exactly what you asked for.
                                </p>
                                <p className="text-muted-foreground">
                                    <strong>Context Engine</strong> — upload an existing exam PDF and QuizAI will
                                    extract the original questions and answers. Upload a textbook chapter instead
                                    and it will write new questions from it. The instructions field lets you
                                    direct the AI with natural language.
                                </p>
                            </div>
                            <div className="border-3 border-foreground bg-card shadow-brutal p-5 space-y-3">
                                {[
                                    { mode: 'Standard', desc: 'Topic → question type mix → difficulty → generate', icon: Brain, color: 'bg-primary text-primary-foreground' },
                                    { mode: 'Context Engine', desc: 'Upload document → write instructions → extract or generate', icon: Upload, color: 'bg-secondary text-secondary-foreground' },
                                    { mode: 'Inline AI', desc: 'Inside the editor — add one AI question at any time', icon: Sparkles, color: 'bg-accent text-accent-foreground' },
                                ].map(m => (
                                    <div key={m.mode} className="flex items-start gap-3 border-2 border-border rounded p-3">
                                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center border-2 border-foreground ${m.color}`}>
                                            <m.icon className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold">{m.mode}</p>
                                            <p className="text-xs text-muted-foreground">{m.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Quiz Bank */}
                        <div className="grid gap-8 grid-cols-1 md:grid-cols-2 items-center">
                            <div className="border-3 border-foreground bg-card shadow-brutal p-5 space-y-3 order-2 md:order-1">
                                {[
                                    { icon: Globe, text: 'Browse all public quizzes from every teacher on the platform' },
                                    { icon: FileText, text: 'Preview full question list with correct answers before copying' },
                                    { icon: Copy, text: 'Copy any quiz into one of your classes in two clicks' },
                                    { icon: Share2, text: 'Send a quiz directly to a specific colleague teacher' },
                                    { icon: CheckCircle, text: 'Toggle your own quizzes public/private from the editor' },
                                ].map(item => (
                                    <div key={item.text} className="flex items-start gap-3 text-sm">
                                        <item.icon className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                                        <span>{item.text}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="space-y-4 order-1 md:order-2">
                                <div className="inline-flex items-center gap-2 border-3 border-foreground bg-secondary text-secondary-foreground px-3 py-1 shadow-brutal-sm font-bold text-xs uppercase tracking-wide">
                                    <Globe className="h-3.5 w-3.5" /> Quiz Bank
                                </div>
                                <h3 className="text-2xl font-extrabold">Share Knowledge, Save Time</h3>
                                <p className="text-muted-foreground">
                                    The Global Quiz Bank is a community library of teacher-created quizzes.
                                    Make your quiz public with one toggle, and other teachers can preview
                                    every question — with answers — before deciding to copy it.
                                </p>
                                <p className="text-muted-foreground">
                                    Prefer a direct handoff? Use peer-to-peer sharing to send a quiz
                                    straight to a colleague's notification inbox. They accept, choose
                                    which class to add it to, and a full deep-copy lands in their drafts.
                                </p>
                            </div>
                        </div>

                        {/* Analytics */}
                        <div className="grid gap-8 grid-cols-1 md:grid-cols-2 items-center">
                            <div className="space-y-4">
                                <div className="inline-flex items-center gap-2 border-3 border-foreground bg-primary text-primary-foreground px-3 py-1 shadow-brutal-sm font-bold text-xs uppercase tracking-wide">
                                    <BarChart3 className="h-3.5 w-3.5" /> Analytics
                                </div>
                                <h3 className="text-2xl font-extrabold">Data-Driven Teaching</h3>
                                <p className="text-muted-foreground">
                                    The analytics dashboard gives you a full picture of your class performance.
                                    See submission counts, average scores, highest and lowest scores, and pass
                                    rates at a glance — for every quiz you've published.
                                </p>
                                <p className="text-muted-foreground">
                                    The anti-cheat section surfaces students with suspicious activity during
                                    exams. Export any quiz's full gradebook as a CSV in one click.
                                </p>
                            </div>
                            <div className="border-3 border-foreground bg-card shadow-brutal p-5">
                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        { label: 'Total Submissions', value: '—', sub: 'across all quizzes' },
                                        { label: 'Avg Score', value: '—', sub: 'weighted average' },
                                        { label: 'Pass Rate', value: '—', sub: '≥ 60% threshold' },
                                        { label: 'Anti-Cheat Flags', value: '—', sub: 'top flagged students' },
                                    ].map(s => (
                                        <div key={s.label} className="border-2 border-border rounded p-3 text-center">
                                            <p className="text-xl font-extrabold text-muted-foreground">{s.value}</p>
                                            <p className="text-xs font-bold mt-0.5">{s.label}</p>
                                            <p className="text-[10px] text-muted-foreground">{s.sub}</p>
                                        </div>
                                    ))}
                                </div>
                                <p className="text-xs text-muted-foreground text-center mt-3">Live data shown after you publish quizzes</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── CTA ─────────────────────────────────────────────────────── */}
                <section className="bg-primary border-b-3 border-foreground">
                    <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8 text-center">
                        <h2 className="text-3xl sm:text-5xl font-extrabold text-primary-foreground tracking-tight">
                            Ready to Teach Smarter?
                        </h2>
                        <p className="mt-4 text-lg text-primary-foreground/80 max-w-xl mx-auto">
                            Create your first AI-generated quiz in under two minutes.
                            No credit card, no setup — just sign up and start teaching.
                        </p>
                        {!auth.user && (
                            <div className="mt-8 flex flex-wrap gap-4 justify-center">
                                <Link href={route('register')}>
                                    <Button variant="secondary" size="lg" className="text-base gap-2">
                                        Get Started Free <ArrowRight className="h-5 w-5" />
                                    </Button>
                                </Link>
                                <Link href={route('login')}>
                                    <Button variant="outline" size="lg" className="text-base text-primary-foreground border-primary-foreground hover:bg-primary-foreground/10">
                                        Sign In
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </div>
                </section>

                {/* ── Footer ──────────────────────────────────────────────────── */}
                <footer className="border-t-3 border-foreground bg-card">
                    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
                        <div className="grid gap-8 grid-cols-1 sm:grid-cols-3">
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <ApplicationLogo className="h-8 w-8" />
                                    <span className="font-extrabold text-lg tracking-tight">QuizAI</span>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    An AI-powered Learning Management System built for modern classrooms.
                                </p>
                                <p className="text-xs text-muted-foreground mt-3">Built with Laravel · React · Groq AI</p>
                            </div>
                            <div>
                                <p className="font-bold text-sm mb-3">For Teachers</p>
                                <ul className="space-y-2 text-sm text-muted-foreground">
                                    <li>AI Quiz Generation</li>
                                    <li>Context Engine (PDF upload)</li>
                                    <li>Global Quiz Bank</li>
                                    <li>Analytics & Gradebook</li>
                                    <li>Anti-Cheat Dashboard</li>
                                </ul>
                            </div>
                            <div>
                                <p className="font-bold text-sm mb-3">For Students</p>
                                <ul className="space-y-2 text-sm text-muted-foreground">
                                    <li>Class Enrollment via Invite Code</li>
                                    <li>Upcoming Quiz Dashboard</li>
                                    <li>Instant Results & Review</li>
                                    <li>In-App Notifications</li>
                                    <li>Printable Result PDF</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}
