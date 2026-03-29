import { Head } from '@inertiajs/react';
import { ClassModel, PageProps, Question, Quiz } from '@/types';
import { useEffect } from 'react';

const TYPE_LABELS: Record<string, string> = {
    multiple_choice: 'Multiple Choice',
    true_false: 'True / False',
    identification: 'Identification',
    coding: 'Coding',
    essay: 'Essay',
};

function AnswerBlock({ lines, label }: { lines: number; label?: string }) {
    return (
        <div className="mt-2 space-y-1">
            {label && <p className="text-xs text-gray-500">{label}</p>}
            {Array.from({ length: lines }).map((_, i) => (
                <div key={i} className="border-b border-gray-400 h-6 w-full" />
            ))}
        </div>
    );
}

function QuestionBlock({ question, number }: { question: Question; number: number }) {
    if (question.type === 'section_header') {
        return (
            <div className="mt-8 mb-4">
                <div className="border-b-2 border-black pb-1">
                    <h3 className="font-bold text-base uppercase tracking-wide">
                        {question.content.title || 'Section'}
                    </h3>
                    {question.content.description && (
                        <p className="text-sm text-gray-600 mt-0.5">{question.content.description}</p>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="mb-6 break-inside-avoid">
            <div className="flex items-start gap-2">
                <span className="font-medium shrink-0 w-7">{number}.</span>
                <div className="flex-1">
                    <div className="flex justify-between items-start gap-4">
                        <p className="text-sm leading-snug">{question.content.question}</p>
                        <span className="text-xs text-gray-500 shrink-0">({question.points} pt{question.points !== 1 ? 's' : ''})</span>
                    </div>

                    {question.type === 'multiple_choice' && question.content.options && (
                        <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1">
                            {(question.content.options as string[]).map((opt: string, i: number) => (
                                <div key={i} className="flex items-center gap-2 text-sm">
                                    <span className="w-5 h-5 border border-black rounded-sm inline-flex items-center justify-center text-xs shrink-0">
                                        {String.fromCharCode(65 + i)}
                                    </span>
                                    <span>{opt}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {question.type === 'true_false' && (
                        <div className="mt-2 flex gap-6 text-sm">
                            <div className="flex items-center gap-2">
                                <span className="w-5 h-5 border border-black inline-block" />
                                <span>True</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-5 h-5 border border-black inline-block" />
                                <span>False</span>
                            </div>
                        </div>
                    )}

                    {question.type === 'identification' && (
                        <AnswerBlock lines={1} />
                    )}

                    {question.type === 'coding' && (
                        <>
                            {question.content.base_code && (
                                <pre className="mt-2 border border-gray-300 bg-gray-50 p-2 text-xs font-mono overflow-x-auto whitespace-pre-wrap">
                                    {question.content.base_code}
                                </pre>
                            )}
                            <AnswerBlock lines={6} label={`Language: ${question.content.language || 'Any'}`} />
                        </>
                    )}

                    {question.type === 'essay' && (
                        <AnswerBlock lines={8} />
                    )}
                </div>
            </div>
        </div>
    );
}

export default function Print({ quiz, classData }: PageProps<{ quiz: Quiz; classData: ClassModel }>) {
    useEffect(() => {
        window.print();
    }, []);

    const questions: Question[] = quiz.questions ?? [];
    const totalPoints = questions.reduce((s, q) => s + (q.type === 'section_header' ? 0 : q.points), 0);

    let questionNumber = 0;

    return (
        <>
            <Head title={`Print: ${quiz.title}`} />

            <style>{`
                @media print {
                    @page { margin: 2cm; size: A4; }
                    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    .no-print { display: none !important; }
                }
            `}</style>

            {/* No-print toolbar */}
            <div className="no-print fixed top-0 left-0 right-0 bg-yellow-100 border-b border-yellow-300 px-6 py-2 flex items-center justify-between z-50">
                <p className="text-sm text-yellow-800">Print preview — your browser's print dialog should open automatically.</p>
                <button
                    onClick={() => window.print()}
                    className="px-4 py-1 bg-black text-white text-sm font-medium"
                >
                    Print / Save PDF
                </button>
            </div>

            {/* Print content */}
            <div className="max-w-[210mm] mx-auto px-8 pt-12 pb-16 print:pt-0 print:px-0 font-serif text-black bg-white min-h-screen">
                {/* Header */}
                <div className="border-b-2 border-black pb-4 mb-6">
                    <h1 className="text-2xl font-bold text-center uppercase tracking-wide">{quiz.title}</h1>
                    <p className="text-center text-sm text-gray-600 mt-1">{classData.name}</p>
                </div>

                {/* Student info row */}
                <div className="grid grid-cols-3 gap-6 mb-8 text-sm">
                    <div>
                        <span className="text-gray-600 mr-1">Name:</span>
                        <span className="border-b border-black inline-block w-36" />
                    </div>
                    <div>
                        <span className="text-gray-600 mr-1">Date:</span>
                        <span className="border-b border-black inline-block w-24" />
                    </div>
                    <div>
                        <span className="text-gray-600 mr-1">Score:</span>
                        <span className="border-b border-black inline-block w-16" />
                        <span className="text-gray-500 ml-1">/ {totalPoints}</span>
                    </div>
                </div>

                {/* Description */}
                {quiz.description && (
                    <div className="border border-gray-300 bg-gray-50 p-3 mb-6 text-sm">
                        <p>{quiz.description}</p>
                    </div>
                )}

                {/* Questions */}
                <div>
                    {questions.map((q) => {
                        if (q.type !== 'section_header') questionNumber++;
                        return (
                            <QuestionBlock
                                key={q.id}
                                question={q}
                                number={questionNumber}
                            />
                        );
                    })}
                </div>

                {/* Footer */}
                <div className="mt-12 pt-4 border-t border-gray-300 text-center text-xs text-gray-400">
                    {quiz.title} · {classData.name} · {totalPoints} points total
                </div>
            </div>
        </>
    );
}
