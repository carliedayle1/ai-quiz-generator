import Modal from '@/Components/Modal';
import { Quiz, Question } from '@/types';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { X } from 'lucide-react';
import QuestionRenderer from '@/Components/Questions/QuestionRenderer';
import { useState } from 'react';

interface Props {
    quiz: Quiz & { questions?: Question[] };
    open: boolean;
    onClose: () => void;
}

export default function QuizPreviewDialog({ quiz, open, onClose }: Props) {
    const [answers, setAnswers] = useState<Record<number, string>>({});

    const questions = quiz.questions ?? [];

    // Assign display numbers to non-header questions
    let questionNumber = 0;

    return (
        <Modal show={open} onClose={onClose} maxWidth="2xl">
            <div className="flex items-center justify-between border-b-3 border-foreground p-4">
                <div>
                    <h2 className="text-lg font-bold">{quiz.title}</h2>
                    <p className="text-sm text-muted-foreground">Preview Mode — read-only</p>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose}>
                    <X className="h-4 w-4" />
                </Button>
            </div>

            <div className="max-h-[70vh] overflow-y-auto p-4 space-y-4">
                {questions.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">No questions yet.</p>
                )}

                {questions.map((question) => {
                    if (question.type === 'section_header') {
                        return (
                            <div
                                key={question.id}
                                className="border-3 border-foreground bg-primary/10 px-4 py-3"
                            >
                                <h3 className="font-bold text-base">
                                    {question.content.title || 'Section'}
                                </h3>
                                {question.content.description && (
                                    <p className="text-sm text-muted-foreground mt-1">
                                        {question.content.description}
                                    </p>
                                )}
                            </div>
                        );
                    }

                    questionNumber += 1;
                    const displayIndex = questionNumber - 1;

                    return (
                        <QuestionRenderer
                            key={question.id}
                            question={question}
                            index={displayIndex}
                            value={answers[question.id] ?? ''}
                            onChange={(v) => setAnswers(prev => ({ ...prev, [question.id]: v }))}
                            readOnly
                        />
                    );
                })}
            </div>

            <div className="border-t-3 border-foreground p-4 flex justify-between items-center">
                <div className="flex gap-2 text-sm text-muted-foreground">
                    <Badge variant="outline">
                        {questions.filter(q => q.type !== 'section_header').length} question{questions.filter(q => q.type !== 'section_header').length !== 1 ? 's' : ''}
                    </Badge>
                    {quiz.time_limit && (
                        <Badge variant="outline">{quiz.time_limit} min</Badge>
                    )}
                </div>
                <Button variant="outline" onClick={onClose}>
                    Close Preview
                </Button>
            </div>
        </Modal>
    );
}
