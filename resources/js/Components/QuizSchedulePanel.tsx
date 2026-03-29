import Modal from '@/Components/Modal';
import { Quiz } from '@/types';
import { Button } from '@/Components/ui/button';
import { Label } from '@/Components/ui/label';
import { Input } from '@/Components/ui/input';
import { X, Calendar } from 'lucide-react';
import { router } from '@inertiajs/react';
import { useState } from 'react';

interface Props {
    quiz: Quiz;
    open: boolean;
    onClose: () => void;
}

function toLocalDatetimeValue(iso: string | null): string {
    if (!iso) return '';
    // Convert ISO string to datetime-local input format (YYYY-MM-DDTHH:mm)
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function QuizSchedulePanel({ quiz, open, onClose }: Props) {
    const [availableFrom, setAvailableFrom] = useState(toLocalDatetimeValue(quiz.available_from));
    const [availableUntil, setAvailableUntil] = useState(toLocalDatetimeValue(quiz.available_until));
    const [dueDate, setDueDate] = useState(toLocalDatetimeValue(quiz.due_date));
    const [processing, setProcessing] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        router.post(
            route('quizzes.schedule', quiz.id),
            {
                available_from: availableFrom || null,
                available_until: availableUntil || null,
                due_date: dueDate || null,
            },
            {
                preserveState: true,
                preserveScroll: true,
                onFinish: () => {
                    setProcessing(false);
                    onClose();
                },
            },
        );
    };

    return (
        <Modal show={open} onClose={onClose} maxWidth="md">
            <div className="flex items-center justify-between border-b-3 border-foreground p-4">
                <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    <h2 className="text-lg font-bold">Schedule Quiz</h2>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose}>
                    <X className="h-4 w-4" />
                </Button>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="p-4 space-y-4">
                    <p className="text-sm text-muted-foreground">
                        Set when students can access this quiz. Leave blank to publish immediately without restrictions.
                    </p>

                    <div className="space-y-2">
                        <Label htmlFor="available_from">Available From</Label>
                        <Input
                            id="available_from"
                            type="datetime-local"
                            value={availableFrom}
                            onChange={(e) => setAvailableFrom(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">Quiz becomes accessible to students at this time.</p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="available_until">Available Until</Label>
                        <Input
                            id="available_until"
                            type="datetime-local"
                            value={availableUntil}
                            onChange={(e) => setAvailableUntil(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">Quiz closes for new submissions after this time.</p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="due_date">Due Date</Label>
                        <Input
                            id="due_date"
                            type="datetime-local"
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">Shown to students as the deadline.</p>
                    </div>
                </div>

                <div className="border-t-3 border-foreground p-4 flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={processing}>
                        {processing ? 'Saving…' : 'Save Schedule'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
