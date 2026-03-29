import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { ClassModel, PageProps, Question, Quiz } from '@/types';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Textarea } from '@/Components/ui/textarea';
import { Card, CardContent } from '@/Components/ui/card';
import QuizPreviewDialog from '@/Components/QuizPreviewDialog';
import QuizSchedulePanel from '@/Components/QuizSchedulePanel';
import ShareQuizDialog from '@/Components/ShareQuizDialog';
import {
    ArrowLeft,
    GripVertical,
    Loader2,
    Plus,
    Printer,
    Share2,
    Sparkles,
    Trash2,
    CheckSquare,
    ToggleLeft,
    HelpCircle,
    Code,
    FileText,
    SplitSquareVertical,
    Eye,
    Calendar,
    Save,
} from 'lucide-react';
import { useEffect, useRef, useState, useCallback } from 'react';
import axios from 'axios';

type QuestionType = 'multiple_choice' | 'true_false' | 'identification' | 'coding' | 'essay' | 'section_header';

const TYPE_ICONS: Record<string, React.ReactNode> = {
    multiple_choice: <CheckSquare className="h-4 w-4" />,
    true_false: <ToggleLeft className="h-4 w-4" />,
    identification: <HelpCircle className="h-4 w-4" />,
    coding: <Code className="h-4 w-4" />,
    essay: <FileText className="h-4 w-4" />,
    section_header: <SplitSquareVertical className="h-4 w-4" />,
};

const TYPE_LABELS: Record<string, string> = {
    multiple_choice: 'Multiple Choice',
    true_false: 'True / False',
    identification: 'Identification',
    coding: 'Coding',
    essay: 'Essay',
    section_header: 'Section Header',
};

const DEFAULT_CONTENT: Record<string, object> = {
    multiple_choice: { question: '', options: ['', '', '', ''], correct_answer: '' },
    true_false: { question: '', correct_answer: true },
    identification: { question: '', correct_answers: [''] },
    coding: { question: '', language: 'JavaScript', base_code: '', grading_rubric_keywords: [] },
    essay: { question: '', grading_rubric: '' },
    section_header: { title: '', description: '' },
};

interface Teacher { id: number; first_name: string; last_name: string; email: string; }

export default function Edit({ quiz: initialQuiz, classData, teachers = [] }: PageProps<{ quiz: Quiz; classData: ClassModel; teachers: Teacher[] }>) {
    const [questions, setQuestions] = useState<Question[]>(initialQuiz.questions ?? []);
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const [title, setTitle] = useState(initialQuiz.title);
    const [description, setDescription] = useState(initialQuiz.description ?? '');
    const [timeLimit, setTimeLimit] = useState<string>(initialQuiz.time_limit ? String(initialQuiz.time_limit) : '');
    const [saveState, setSaveState] = useState<'saved' | 'saving' | 'unsaved'>('saved');
    const [previewOpen, setPreviewOpen] = useState(false);
    const [scheduleOpen, setScheduleOpen] = useState(false);
    const [aiGenerating, setAiGenerating] = useState(false);
    const [aiTypePickerOpen, setAiTypePickerOpen] = useState(false);
    const [shareOpen, setShareOpen] = useState(false);
    const [dragIndex, setDragIndex] = useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
    const saveTimer = useRef<ReturnType<typeof setTimeout>>();
    const reorderTimer = useRef<ReturnType<typeof setTimeout>>();

    // Auto-save quiz metadata
    const scheduleMetaSave = useCallback(() => {
        setSaveState('unsaved');
        clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(() => {
            setSaveState('saving');
            router.put(route('quizzes.update', initialQuiz.id), {
                title,
                description: description || null,
                time_limit: timeLimit ? parseInt(timeLimit) : null,
            }, {
                preserveState: true,
                preserveScroll: true,
                onSuccess: () => setSaveState('saved'),
                onError: () => setSaveState('unsaved'),
            });
        }, 1500);
    }, [title, description, timeLimit, initialQuiz.id]);

    useEffect(() => {
        scheduleMetaSave();
        return () => clearTimeout(saveTimer.current);
    }, [title, description, timeLimit]);

    const selectedQuestion = selectedIndex !== null ? questions[selectedIndex] : null;

    // Add a new question
    const addQuestion = async (type: QuestionType) => {
        const content = DEFAULT_CONTENT[type];
        const points = type === 'section_header' ? 0 : 1;
        try {
            const resp = await axios.post(route('questions.store', initialQuiz.id), { type, content, points });
            const newQ: Question = resp.data.question;
            setQuestions(prev => [...prev, newQ]);
            setSelectedIndex(questions.length);
        } catch (e) {
            console.error('Failed to add question', e);
        }
    };

    // Generate a single AI question of a given type
    const generateViaAI = async (type: QuestionType) => {
        setAiTypePickerOpen(false);
        setAiGenerating(true);
        try {
            const resp = await axios.post(route('quizzes.generate-single', initialQuiz.id), { question_type: type });
            const generated = resp.data.question;
            // Build content from AI response
            const { question: questionText, points: aiPoints, ...rest } = generated;
            const content = { question: questionText ?? '', ...rest };
            // Store it
            const storeResp = await axios.post(route('questions.store', initialQuiz.id), {
                type,
                content: { ...DEFAULT_CONTENT[type], ...content },
                points: aiPoints ?? 1,
            });
            const newQ: Question = storeResp.data.question;
            setQuestions(prev => [...prev, newQ]);
            setSelectedIndex(questions.length);
        } catch (e: any) {
            console.error('Failed to generate question via AI', e?.response?.data?.error || e);
        } finally {
            setAiGenerating(false);
        }
    };

    // Delete a question
    const deleteQuestion = async (idx: number) => {
        const q = questions[idx];
        try {
            await axios.delete(route('questions.destroy', [initialQuiz.id, q.id]));
            setQuestions(prev => {
                const updated = prev.filter((_, i) => i !== idx);
                return updated;
            });
            if (selectedIndex === idx) setSelectedIndex(null);
            else if (selectedIndex !== null && selectedIndex > idx) setSelectedIndex(selectedIndex - 1);
        } catch (e) {
            console.error('Failed to delete question', e);
        }
    };

    // Update a question's content/points via debounced axios
    const updateQuestionField = useCallback((idx: number, patch: Partial<Question>) => {
        setQuestions(prev => prev.map((q, i) => i === idx ? { ...q, ...patch } : q));
        const q = questions[idx];
        clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(async () => {
            try {
                await axios.put(route('questions.update', [initialQuiz.id, q.id]), patch);
            } catch (e) {
                console.error('Failed to update question', e);
            }
        }, 800);
    }, [questions, initialQuiz.id]);

    // Drag and drop
    const onDragStart = (e: React.DragEvent, idx: number) => {
        setDragIndex(idx);
        e.dataTransfer.effectAllowed = 'move';
    };
    const onDragOver = (e: React.DragEvent, idx: number) => {
        e.preventDefault();
        setDragOverIndex(idx);
    };
    const onDrop = (e: React.DragEvent, dropIdx: number) => {
        e.preventDefault();
        if (dragIndex === null || dragIndex === dropIdx) {
            setDragIndex(null);
            setDragOverIndex(null);
            return;
        }
        const reordered = [...questions];
        const [moved] = reordered.splice(dragIndex, 1);
        reordered.splice(dropIdx, 0, moved);
        const withOrders = reordered.map((q, i) => ({ ...q, order: i }));
        setQuestions(withOrders);
        if (selectedIndex === dragIndex) setSelectedIndex(dropIdx);
        setDragIndex(null);
        setDragOverIndex(null);

        clearTimeout(reorderTimer.current);
        reorderTimer.current = setTimeout(() => {
            axios.post(route('questions.reorder', initialQuiz.id), {
                questions: withOrders.map(q => ({ id: q.id, order: q.order })),
            }).catch(console.error);
        }, 300);
    };
    const onDragEnd = () => { setDragIndex(null); setDragOverIndex(null); };

    const quiz = { ...initialQuiz, questions, title, description: description || null };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3">
                        <Link href={classData ? route('classes.show', classData.id) : route('classes.index')}>
                            <Button variant="outline" size="icon">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <div>
                            <input
                                className="text-xl font-bold bg-transparent border-none outline-none focus:border-b-2 focus:border-primary w-full max-w-sm"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                placeholder="Quiz Title"
                            />
                            <div className="flex items-center gap-2 mt-1">
                                <Badge variant={initialQuiz.status === 'published' ? 'default' : 'secondary'}>
                                    {initialQuiz.status}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                    {saveState === 'saving' ? 'Saving...' : saveState === 'saved' ? 'Saved' : 'Unsaved changes'}
                                </span>
                                <Save className={`h-3 w-3 ${saveState === 'unsaved' ? 'text-orange-500' : 'text-muted-foreground'}`} />
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Make Public toggle */}
                        <button
                            type="button"
                            onClick={() => router.post(route('quizzes.toggle-public', initialQuiz.id), {}, { preserveState: false })}
                            className={`flex items-center gap-1.5 text-xs border-2 px-2 py-1 transition-colors ${
                                initialQuiz.is_public
                                    ? 'border-primary bg-primary/10 text-primary'
                                    : 'border-border text-muted-foreground hover:border-foreground'
                            }`}
                            title={initialQuiz.is_public ? 'Remove from Quiz Bank' : 'Share in Global Quiz Bank'}
                        >
                            <span className={`w-7 h-4 rounded-full transition-colors flex items-center px-0.5 ${initialQuiz.is_public ? 'bg-primary' : 'bg-muted'}`}>
                                <span className={`w-3 h-3 rounded-full bg-white transition-transform ${initialQuiz.is_public ? 'translate-x-3' : 'translate-x-0'}`} />
                            </span>
                            Public
                        </button>
                        <Button variant="outline" onClick={() => setPreviewOpen(true)}>
                            <Eye className="mr-2 h-4 w-4" /> Preview
                        </Button>
                        <Button variant="outline" onClick={() => setScheduleOpen(true)}>
                            <Calendar className="mr-2 h-4 w-4" /> Schedule
                        </Button>
                        <Link href={route('quizzes.print', initialQuiz.id)} target="_blank">
                            <Button variant="outline">
                                <Printer className="mr-2 h-4 w-4" /> Print
                            </Button>
                        </Link>
                        {teachers.length > 0 && (
                            <Button variant="outline" onClick={() => setShareOpen(true)}>
                                <Share2 className="mr-2 h-4 w-4" /> Share
                            </Button>
                        )}
                        <Button onClick={() => router.post(
                            initialQuiz.status === 'published'
                                ? route('quizzes.unpublish', initialQuiz.id)
                                : route('quizzes.publish', initialQuiz.id)
                        )}>
                            {initialQuiz.status === 'published' ? 'Unpublish' : 'Publish'}
                        </Button>
                    </div>
                </div>
            }
        >
            <Head title={`Edit: ${title}`} />

            <div className="flex h-[calc(100vh-10rem)]">
                {/* Left panel: question list */}
                <div className="w-72 shrink-0 border-r-3 border-foreground flex flex-col bg-card overflow-hidden">
                    {/* Quiz meta */}
                    <div className="p-3 border-b-2 border-border space-y-2">
                        <div>
                            <Label className="text-xs">Description</Label>
                            <Textarea
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                placeholder="Quiz description..."
                                className="text-sm mt-1 min-h-[60px]"
                            />
                        </div>
                        <div>
                            <Label className="text-xs">Time Limit (minutes)</Label>
                            <Input
                                type="number"
                                min={1}
                                max={480}
                                value={timeLimit}
                                onChange={e => setTimeLimit(e.target.value)}
                                placeholder="No limit"
                                className="text-sm mt-1"
                            />
                        </div>
                    </div>

                    {/* Question list */}
                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                        {questions.length === 0 && (
                            <p className="text-xs text-muted-foreground text-center py-4">No questions yet</p>
                        )}
                        {questions.map((q, idx) => (
                            <div
                                key={q.id}
                                draggable
                                onDragStart={e => onDragStart(e, idx)}
                                onDragOver={e => onDragOver(e, idx)}
                                onDrop={e => onDrop(e, idx)}
                                onDragEnd={onDragEnd}
                                onClick={() => setSelectedIndex(idx)}
                                className={`flex items-center gap-2 p-2 rounded border-2 cursor-pointer transition-colors ${
                                    selectedIndex === idx
                                        ? 'border-primary bg-primary/5'
                                        : 'border-transparent hover:border-border'
                                } ${dragOverIndex === idx ? 'border-primary border-dashed' : ''}`}
                            >
                                <GripVertical className="h-4 w-4 text-muted-foreground shrink-0 cursor-grab" />
                                <span className="text-muted-foreground">{TYPE_ICONS[q.type]}</span>
                                <span className="text-xs flex-1 truncate">
                                    {q.type === 'section_header'
                                        ? (q.content.title || 'Section Header')
                                        : (q.content.question || 'Untitled question')}
                                </span>
                                {q.type !== 'section_header' && (
                                    <span className="text-xs text-muted-foreground shrink-0">{q.points}pt</span>
                                )}
                                <button
                                    onClick={e => { e.stopPropagation(); deleteQuestion(idx); }}
                                    className="text-muted-foreground hover:text-destructive shrink-0"
                                >
                                    <Trash2 className="h-3 w-3" />
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Add question buttons */}
                    <div className="p-2 border-t-2 border-border space-y-1">
                        <p className="text-xs font-bold text-muted-foreground uppercase px-1">Add</p>
                        {/* Generate via AI */}
                        <div className="relative mb-1">
                            <Button
                                variant="outline"
                                size="sm"
                                className="w-full text-xs justify-start gap-1 h-7 border-primary text-primary hover:bg-primary/5"
                                onClick={() => setAiTypePickerOpen(prev => !prev)}
                                disabled={aiGenerating}
                            >
                                {aiGenerating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                                {aiGenerating ? 'Generating...' : 'Generate via AI'}
                            </Button>
                            {aiTypePickerOpen && (
                                <div className="absolute bottom-full left-0 right-0 mb-1 bg-card border-2 border-foreground shadow-md z-10 p-1 space-y-0.5">
                                    <p className="text-xs text-muted-foreground px-1 pb-0.5">Choose type:</p>
                                    {(Object.keys(TYPE_LABELS).filter(t => t !== 'section_header') as QuestionType[]).map(type => (
                                        <button
                                            key={type}
                                            className="flex items-center gap-2 w-full text-xs px-2 py-1 hover:bg-primary/10 rounded text-left"
                                            onClick={() => generateViaAI(type)}
                                        >
                                            {TYPE_ICONS[type]}
                                            {TYPE_LABELS[type]}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="grid grid-cols-2 gap-1">
                            {(Object.keys(TYPE_LABELS) as QuestionType[]).map(type => (
                                <Button
                                    key={type}
                                    variant="outline"
                                    size="sm"
                                    className="text-xs justify-start gap-1 h-7"
                                    onClick={() => addQuestion(type)}
                                >
                                    {TYPE_ICONS[type]}
                                    <span className="truncate">{type === 'section_header' ? 'Section' : TYPE_LABELS[type].split(' ')[0]}</span>
                                </Button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right panel: question editor */}
                <div className="flex-1 overflow-y-auto p-6">
                    {selectedQuestion === null ? (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                            <Plus className="h-12 w-12 mb-3 opacity-30" />
                            <p className="text-sm">Select a question to edit, or add one from the left panel</p>
                        </div>
                    ) : (
                        <QuestionEditor
                            key={selectedQuestion.id}
                            question={selectedQuestion}
                            index={selectedIndex!}
                            onChange={patch => updateQuestionField(selectedIndex!, patch)}
                        />
                    )}
                </div>
            </div>

            <QuizPreviewDialog
                quiz={quiz}
                open={previewOpen}
                onClose={() => setPreviewOpen(false)}
            />
            <QuizSchedulePanel
                quiz={initialQuiz}
                open={scheduleOpen}
                onClose={() => setScheduleOpen(false)}
            />
            <ShareQuizDialog
                quizId={initialQuiz.id}
                teachers={teachers}
                open={shareOpen}
                onClose={() => setShareOpen(false)}
            />
        </AuthenticatedLayout>
    );
}

// ─── Question Editor ──────────────────────────────────────────────────────────

function QuestionEditor({ question, index, onChange }: {
    question: Question;
    index: number;
    onChange: (patch: Partial<Question>) => void;
}) {
    const updateContent = (key: string, value: any) => {
        onChange({ content: { ...question.content, [key]: value } });
    };

    if (question.type === 'section_header') {
        return (
            <Card>
                <CardContent className="pt-6 space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                        <SplitSquareVertical className="h-5 w-5 text-muted-foreground" />
                        <h3 className="font-bold text-foreground">Section Header</h3>
                    </div>
                    <div>
                        <Label>Section Title</Label>
                        <Input
                            className="mt-1"
                            value={question.content.title ?? ''}
                            onChange={e => updateContent('title', e.target.value)}
                            placeholder="e.g. I. True or False"
                        />
                    </div>
                    <div>
                        <Label>Instructions (optional)</Label>
                        <Textarea
                            className="mt-1"
                            value={question.content.description ?? ''}
                            onChange={e => updateContent('description', e.target.value)}
                            placeholder="Instructions for this section..."
                        />
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardContent className="pt-6 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                    <span className="text-muted-foreground">{TYPE_ICONS[question.type]}</span>
                    <h3 className="font-bold text-foreground">{TYPE_LABELS[question.type]}</h3>
                    <span className="text-sm text-muted-foreground ml-auto">Question {index + 1}</span>
                </div>

                <div>
                    <Label>Question Text</Label>
                    <Textarea
                        className="mt-1"
                        value={question.content.question ?? ''}
                        onChange={e => updateContent('question', e.target.value)}
                        placeholder="Enter the question..."
                        rows={3}
                    />
                </div>

                {question.type === 'multiple_choice' && (
                    <MultipleChoiceEditor question={question} onChange={updateContent} />
                )}

                {question.type === 'true_false' && (
                    <div>
                        <Label>Correct Answer</Label>
                        <div className="flex gap-2 mt-1">
                            {[true, false].map(val => (
                                <Button
                                    key={String(val)}
                                    variant={question.content.correct_answer === val ? 'default' : 'outline'}
                                    onClick={() => updateContent('correct_answer', val)}
                                >
                                    {val ? 'True' : 'False'}
                                </Button>
                            ))}
                        </div>
                    </div>
                )}

                {question.type === 'identification' && (
                    <IdentificationEditor question={question} onChange={updateContent} />
                )}

                {question.type === 'coding' && (
                    <div className="space-y-3">
                        <div>
                            <Label>Programming Language</Label>
                            <Input
                                className="mt-1"
                                value={question.content.language ?? ''}
                                onChange={e => updateContent('language', e.target.value)}
                                placeholder="JavaScript"
                            />
                        </div>
                        <div>
                            <Label>Starter Code / Fill-in-the-blank snippet (optional)</Label>
                            <Textarea
                                className="mt-1 font-mono text-sm"
                                value={question.content.base_code ?? ''}
                                onChange={e => updateContent('base_code', e.target.value)}
                                placeholder={"// Shown to students above their answer box\nfunction solution() {\n  // your code here\n}"}
                                rows={5}
                                spellCheck={false}
                            />
                        </div>
                        <div>
                            <Label>Grading Rubric Keywords (comma-separated)</Label>
                            <Input
                                className="mt-1"
                                value={(question.content.grading_rubric_keywords ?? []).join(', ')}
                                onChange={e => updateContent('grading_rubric_keywords', e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean))}
                                placeholder="function, loop, return"
                            />
                        </div>
                    </div>
                )}

                {question.type === 'essay' && (
                    <div>
                        <Label>Grading Rubric</Label>
                        <Textarea
                            className="mt-1"
                            value={question.content.grading_rubric ?? ''}
                            onChange={e => updateContent('grading_rubric', e.target.value)}
                            placeholder="Describe the grading criteria..."
                        />
                    </div>
                )}

                <div className="flex items-center gap-3 pt-2 border-t border-border">
                    <Label>Points</Label>
                    <Input
                        type="number"
                        min={1}
                        max={100}
                        value={question.points}
                        onChange={e => onChange({ points: parseInt(e.target.value) || 1 })}
                        className="w-20"
                    />
                </div>
            </CardContent>
        </Card>
    );
}

function MultipleChoiceEditor({ question, onChange }: {
    question: Question;
    onChange: (key: string, value: any) => void;
}) {
    const options: string[] = question.content.options ?? ['', '', '', ''];

    return (
        <div className="space-y-3">
            <Label>Answer Options</Label>
            {options.map((opt: string, i: number) => (
                <div key={i} className="flex items-center gap-2">
                    <button
                        className={`w-7 h-7 rounded-full border-2 shrink-0 font-bold text-sm ${
                            opt === question.content.correct_answer
                                ? 'bg-primary border-primary text-primary-foreground'
                                : 'border-muted-foreground text-muted-foreground'
                        }`}
                        onClick={() => onChange('correct_answer', opt)}
                        title="Mark as correct"
                    >
                        {String.fromCharCode(65 + i)}
                    </button>
                    <Input
                        value={opt}
                        onChange={e => {
                            const updated = [...options];
                            updated[i] = e.target.value;
                            onChange('options', updated);
                            // Update correct_answer if it matched old value
                            if (question.content.correct_answer === opt) {
                                onChange('correct_answer', e.target.value);
                            }
                        }}
                        placeholder={`Option ${String.fromCharCode(65 + i)}`}
                    />
                </div>
            ))}
            <p className="text-xs text-muted-foreground">Click the letter button to mark the correct answer.</p>
        </div>
    );
}

function IdentificationEditor({ question, onChange }: {
    question: Question;
    onChange: (key: string, value: any) => void;
}) {
    const answers: string[] = question.content.correct_answers ?? [''];

    return (
        <div className="space-y-2">
            <Label>Accepted Answers (case-insensitive)</Label>
            {answers.map((ans: string, i: number) => (
                <div key={i} className="flex gap-2">
                    <Input
                        value={ans}
                        onChange={e => {
                            const updated = [...answers];
                            updated[i] = e.target.value;
                            onChange('correct_answers', updated);
                        }}
                        placeholder={`Answer ${i + 1}`}
                    />
                    {answers.length > 1 && (
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => onChange('correct_answers', answers.filter((_, j) => j !== i))}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            ))}
            <Button
                variant="outline"
                size="sm"
                onClick={() => onChange('correct_answers', [...answers, ''])}
            >
                <Plus className="mr-1 h-3 w-3" /> Add alternate answer
            </Button>
        </div>
    );
}
