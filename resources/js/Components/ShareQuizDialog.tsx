import { router } from '@inertiajs/react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/Components/ui/dialog';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Share2 } from 'lucide-react';
import { useState } from 'react';

interface Teacher {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
}

interface Props {
    quizId: number;
    teachers: Teacher[];
    open: boolean;
    onClose: () => void;
}

export default function ShareQuizDialog({ quizId, teachers, open, onClose }: Props) {
    const [search, setSearch] = useState('');
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [sharing, setSharing] = useState(false);

    const filtered = teachers.filter(t =>
        `${t.first_name} ${t.last_name} ${t.email}`.toLowerCase().includes(search.toLowerCase())
    );

    const handleShare = () => {
        if (!selectedId) return;
        setSharing(true);
        router.post(route('quizzes.share', quizId), { recipient_id: selectedId }, {
            onSuccess: () => {
                setSearch('');
                setSelectedId(null);
                onClose();
            },
            onFinish: () => setSharing(false),
        });
    };

    return (
        <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Share2 className="h-4 w-4" />
                        Share Quiz with Teacher
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-3">
                    <Input
                        placeholder="Search teachers by name or email..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        autoFocus
                    />

                    <div className="max-h-60 overflow-y-auto border-2 border-border divide-y divide-border">
                        {filtered.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-6">No teachers found.</p>
                        ) : (
                            filtered.map(teacher => (
                                <button
                                    key={teacher.id}
                                    type="button"
                                    onClick={() => setSelectedId(teacher.id === selectedId ? null : teacher.id)}
                                    className={`w-full text-left px-3 py-2.5 flex items-center justify-between transition-colors hover:bg-accent ${
                                        selectedId === teacher.id ? 'bg-primary/10 border-l-2 border-primary' : ''
                                    }`}
                                >
                                    <div>
                                        <p className="text-sm font-medium">{teacher.first_name} {teacher.last_name}</p>
                                        <p className="text-xs text-muted-foreground">{teacher.email}</p>
                                    </div>
                                    {selectedId === teacher.id && (
                                        <span className="text-xs text-primary font-medium">Selected</span>
                                    )}
                                </button>
                            ))
                        )}
                    </div>

                    <div className="flex justify-end gap-2 pt-1">
                        <Button variant="outline" onClick={onClose}>Cancel</Button>
                        <Button onClick={handleShare} disabled={!selectedId || sharing}>
                            {sharing ? 'Sharing...' : 'Share Quiz'}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
