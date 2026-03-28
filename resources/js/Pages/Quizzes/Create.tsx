import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
import { ClassModel, PageProps } from '@/types';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Textarea } from '@/Components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import { Badge } from '@/Components/ui/badge';
import { FormEventHandler, useState } from 'react';
import {
    CheckSquare,
    Code,
    FileText,
    HelpCircle,
    Loader2,
    Minus,
    Plus,
    Sparkles,
    ToggleLeft,
    Trash2,
} from 'lucide-react';
import axios from 'axios';

interface GeneratedQuestion {
    type: string;
    question: string;
    points: number;
    [key: string]: any;
}

interface QuestionTypeConfig {
    key: string;
    label: string;
    description: string;
    icon: React.ReactNode;
    badgeVariant: 'default' | 'secondary' | 'outline' | 'destructive';
}

const QUESTION_TYPES: QuestionTypeConfig[] = [
    {
        key: 'multiple_choice',
        label: 'Multiple Choice',
        description: 'Choose the correct answer from options',
        icon: <CheckSquare className="h-5 w-5" />,
        badgeVariant: 'default',
    },
    {
        key: 'true_false',
        label: 'True / False',
        description: 'Determine if a statement is true or false',
        icon: <ToggleLeft className="h-5 w-5" />,
        badgeVariant: 'secondary',
    },
    {
        key: 'identification',
        label: 'Identification',
        description: 'Type the correct term or answer',
        icon: <HelpCircle className="h-5 w-5" />,
        badgeVariant: 'outline',
    },
    {
        key: 'coding',
        label: 'Coding',
        description: 'Write code to solve a problem',
        icon: <Code className="h-5 w-5" />,
        badgeVariant: 'destructive',
    },
    {
        key: 'essay',
        label: 'Essay',
        description: 'Write a detailed response',
        icon: <FileText className="h-5 w-5" />,
        badgeVariant: 'secondary',
    },
];

export default function Create({ classData }: PageProps<{ classData: ClassModel }>) {
    const [generating, setGenerating] = useState(false);
    const [generatedQuestions, setGeneratedQuestions] = useState<GeneratedQuestion[]>([]);
    const [genError, setGenError] = useState('');

    const [topic, setTopic] = useState('');
    const [difficulty, setDifficulty] = useState('medium');
    const [typeCounts, setTypeCounts] = useState<Record<string, number>>({
        multiple_choice: 5,
        true_false: 0,
        identification: 0,
        coding: 0,
        essay: 0,
    });

    const totalQuestions = Object.values(typeCounts).reduce((sum, c) => sum + c, 0);

    const updateCount = (key: string, delta: number) => {
        setTypeCounts((prev) => ({
            ...prev,
            [key]: Math.max(0, Math.min(50, (prev[key] || 0) + delta)),
        }));
    };

    const setCount = (key: string, value: string) => {
        const num = parseInt(value) || 0;
        setTypeCounts((prev) => ({
            ...prev,
            [key]: Math.max(0, Math.min(50, num)),
        }));
    };

    const form = useForm({
        title: '',
        description: '',
        time_limit: '',
        questions: [] as { type: string; content: Record<string, any>; points: number }[],
    });

    const handleGenerate = async () => {
        if (totalQuestions === 0) return;
        setGenerating(true);
        setGenError('');

        // Build breakdown for the prompt
        const breakdown: Record<string, number> = {};
        for (const [key, count] of Object.entries(typeCounts)) {
            if (count > 0) breakdown[key] = count;
        }

        try {
            const response = await axios.post(route('quizzes.generate', classData.id), {
                topic,
                num_questions: totalQuestions,
                difficulty,
                question_types_breakdown: breakdown,
            });

            setGeneratedQuestions(response.data.questions);
        } catch (err: any) {
            setGenError(err.response?.data?.error || 'Failed to generate quiz. Please try again.');
        } finally {
            setGenerating(false);
        }
    };

    const removeQuestion = (index: number) => {
        setGeneratedQuestions((prev) => prev.filter((_, i) => i !== index));
    };

    const updateQuestionPoints = (index: number, points: number) => {
        setGeneratedQuestions((prev) =>
            prev.map((q, i) => (i === index ? { ...q, points: Math.max(1, Math.min(100, points)) } : q))
        );
    };

    const handleSave: FormEventHandler = (e) => {
        e.preventDefault();

        const questions = generatedQuestions.map((q) => {
            const { type, question, points, ...rest } = q;
            return {
                type,
                content: { question, ...rest },
                points,
            };
        });

        form.transform((data) => ({
            ...data,
            questions,
            time_limit: data.time_limit ? parseInt(data.time_limit) : null,
        }));

        form.post(route('quizzes.store', classData.id));
    };

    const questionTypeLabels: Record<string, string> = {};
    const questionTypeColors: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {};
    for (const qt of QUESTION_TYPES) {
        questionTypeLabels[qt.key] = qt.label;
        questionTypeColors[qt.key] = qt.badgeVariant;
    }

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-bold leading-tight text-foreground">
                    Create Quiz for {classData.name}
                </h2>
            }
        >
            <Head title="Create Quiz" />

            <div className="py-12">
                <div className="mx-auto max-w-4xl sm:px-6 lg:px-8 space-y-6">
                    {/* AI Generation Section */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Sparkles className="h-5 w-5" />
                                AI Quiz Generator
                            </CardTitle>
                            <CardDescription>
                                Choose a topic, set the difficulty, and pick how many of each question type you want.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Topic & Difficulty */}
                            <div className="grid gap-4 md:grid-cols-4">
                                <div className="md:col-span-3">
                                    <Label htmlFor="topic">Topic</Label>
                                    <Input
                                        id="topic"
                                        value={topic}
                                        onChange={(e) => setTopic(e.target.value)}
                                        placeholder="e.g., Photosynthesis in plants, JavaScript closures, World War II"
                                    />
                                </div>
                                <div>
                                    <Label>Difficulty</Label>
                                    <Select value={difficulty} onValueChange={setDifficulty}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="easy">Easy</SelectItem>
                                            <SelectItem value="medium">Medium</SelectItem>
                                            <SelectItem value="hard">Hard</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Question Type Breakdown */}
                            <div>
                                <Label className="mb-3 block">Question Types & Counts</Label>
                                <div className="flex flex-col gap-3">
                                    {QUESTION_TYPES.map((qt) => (
                                        <div
                                            key={qt.key}
                                            className={`flex items-center justify-between border-3 border-foreground p-3 transition-colors ${
                                                typeCounts[qt.key] > 0
                                                    ? 'border-primary bg-primary/5'
                                                    : 'border-foreground'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="text-muted-foreground">{qt.icon}</div>
                                                <div>
                                                    <p className="text-sm font-medium text-foreground">{qt.label}</p>
                                                    <p className="text-xs text-muted-foreground">{qt.description}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="icon"
                                                    className="h-7 w-7"
                                                    onClick={() => updateCount(qt.key, -1)}
                                                    disabled={typeCounts[qt.key] <= 0}
                                                >
                                                    <Minus className="h-3 w-3" />
                                                </Button>
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    max="50"
                                                    value={typeCounts[qt.key]}
                                                    onChange={(e) => setCount(qt.key, e.target.value)}
                                                    className="h-7 w-12 text-center px-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                />
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="icon"
                                                    className="h-7 w-7"
                                                    onClick={() => updateCount(qt.key, 1)}
                                                >
                                                    <Plus className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Summary & Generate */}
                            <div className="flex items-center justify-between pt-2 border-t-3 border-foreground">
                                <div className="text-sm text-muted-foreground">
                                    Total: <span className="font-bold text-foreground">{totalQuestions}</span> question{totalQuestions !== 1 ? 's' : ''}
                                    {totalQuestions > 0 && (
                                        <span className="ml-2">
                                            ({Object.entries(typeCounts)
                                                .filter(([, c]) => c > 0)
                                                .map(([k, c]) => `${c} ${questionTypeLabels[k]}`)
                                                .join(', ')})
                                        </span>
                                    )}
                                </div>
                                <Button
                                    onClick={handleGenerate}
                                    disabled={generating || !topic.trim() || totalQuestions === 0}
                                >
                                    {generating ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Generating...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="mr-2 h-4 w-4" />
                                            Generate Quiz
                                        </>
                                    )}
                                </Button>
                            </div>

                            {genError && (
                                <p className="text-sm text-destructive">{genError}</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Generated Questions Preview */}
                    {generatedQuestions.length > 0 && (
                        <form onSubmit={handleSave}>
                            <Card>
                                <CardHeader>
                                    <CardTitle>Quiz Details</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                                        <div>
                                            <Label htmlFor="title">Quiz Title</Label>
                                            <Input
                                                id="title"
                                                value={form.data.title}
                                                onChange={(e) => form.setData('title', e.target.value)}
                                                placeholder="e.g., Midterm Exam - Chapter 5"
                                                required
                                            />
                                            {form.errors.title && (
                                                <p className="text-sm text-destructive mt-1">{form.errors.title}</p>
                                            )}
                                        </div>
                                        <div>
                                            <Label htmlFor="time_limit">Time Limit (minutes, optional)</Label>
                                            <Input
                                                id="time_limit"
                                                type="number"
                                                min="1"
                                                max="480"
                                                value={form.data.time_limit}
                                                onChange={(e) => form.setData('time_limit', e.target.value)}
                                                placeholder="e.g., 60"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <Label htmlFor="quiz_description">Description (optional)</Label>
                                        <Textarea
                                            id="quiz_description"
                                            value={form.data.description}
                                            onChange={(e) => form.setData('description', e.target.value)}
                                            placeholder="Instructions for students..."
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="mt-6 space-y-6">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-medium text-foreground">
                                        Questions ({generatedQuestions.length})
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        Total: {generatedQuestions.reduce((s, q) => s + q.points, 0)} points
                                    </p>
                                </div>

                                {QUESTION_TYPES
                                    .filter((qt) => generatedQuestions.some((q) => q.type === qt.key))
                                    .map((qt) => {
                                        const questionsOfType = generatedQuestions
                                            .map((q, originalIndex): GeneratedQuestion & { originalIndex: number } => ({ ...q, originalIndex }))
                                            .filter((q) => q.type === qt.key);

                                        return (
                                            <div key={qt.key} className="space-y-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="text-muted-foreground">{qt.icon}</div>
                                                    <h4 className="font-medium text-foreground">{qt.label}</h4>
                                                    <Badge variant={qt.badgeVariant}>{questionsOfType.length}</Badge>
                                                    <span className="text-sm text-muted-foreground">
                                                        {questionsOfType.reduce((s, q) => s + q.points, 0)} pts
                                                    </span>
                                                </div>

                                                <div className="space-y-3 pl-7">
                                                    {questionsOfType.map((q, typeIndex) => (
                                                        <Card key={q.originalIndex}>
                                                            <CardContent className="pt-4 pb-4">
                                                                <div className="flex items-start justify-between">
                                                                    <div className="flex-1">
                                                                        <div className="flex items-center gap-2 mb-1">
                                                                            <span className="text-sm font-medium text-muted-foreground">
                                                                                {typeIndex + 1}.
                                                                            </span>
                                                                            <div className="flex items-center gap-1">
                                                                                <Input
                                                                                    type="number"
                                                                                    min="1"
                                                                                    max="100"
                                                                                    value={q.points}
                                                                                    onChange={(e) => updateQuestionPoints(q.originalIndex, parseInt(e.target.value) || 1)}
                                                                                    className="h-6 w-14 text-center text-xs px-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                                                />
                                                                                <span className="text-xs text-muted-foreground">pts</span>
                                                                            </div>
                                                                        </div>
                                                                        <p className="text-foreground">{q.question}</p>

                                                                        {q.type === 'multiple_choice' && q.options && (
                                                                            <ul className="mt-2 space-y-1">
                                                                                {q.options.map((opt: string, i: number) => (
                                                                                    <li
                                                                                        key={i}
                                                                                        className={`text-sm pl-4 ${opt === q.correct_answer ? 'text-green-600 dark:text-green-400 font-medium' : 'text-muted-foreground'}`}
                                                                                    >
                                                                                        {String.fromCharCode(65 + i)}. {opt}
                                                                                        {opt === q.correct_answer && ' ✓'}
                                                                                    </li>
                                                                                ))}
                                                                            </ul>
                                                                        )}

                                                                        {q.type === 'true_false' && (
                                                                            <p className="mt-1 text-sm text-green-600 dark:text-green-400">
                                                                                Answer: {q.correct_answer ? 'True' : 'False'}
                                                                            </p>
                                                                        )}

                                                                        {q.type === 'identification' && q.correct_answers && (
                                                                            <p className="mt-1 text-sm text-green-600 dark:text-green-400">
                                                                                Answers: {q.correct_answers.join(', ')}
                                                                            </p>
                                                                        )}

                                                                        {q.type === 'coding' && (
                                                                            <p className="mt-1 text-sm text-muted-foreground">
                                                                                Language: {q.language || 'Any'}
                                                                            </p>
                                                                        )}

                                                                        {q.type === 'essay' && q.grading_rubric && (
                                                                            <p className="mt-1 text-sm text-muted-foreground">
                                                                                Rubric: {q.grading_rubric}
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                    <Button
                                                                        type="button"
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-8 w-8"
                                                                        onClick={() => removeQuestion(q.originalIndex)}
                                                                    >
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </Button>
                                                                </div>
                                                            </CardContent>
                                                        </Card>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                            </div>

                            <div className="mt-6 flex justify-end gap-2">
                                <Button type="submit" disabled={form.processing || !form.data.title}>
                                    Save Quiz as Draft
                                </Button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
