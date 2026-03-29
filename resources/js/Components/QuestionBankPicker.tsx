import Modal from '@/Components/Modal';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Badge } from '@/Components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import { CheckSquare, Code, Database, FileText, HelpCircle, Loader2, Search, ToggleLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import axios from 'axios';

interface BankItem {
    id: number;
    type: string;
    content: Record<string, any>;
    points: number;
    subject: string | null;
    difficulty: string;
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
    multiple_choice: <CheckSquare className="h-4 w-4" />,
    true_false: <ToggleLeft className="h-4 w-4" />,
    identification: <HelpCircle className="h-4 w-4" />,
    coding: <Code className="h-4 w-4" />,
    essay: <FileText className="h-4 w-4" />,
};

const TYPE_LABELS: Record<string, string> = {
    multiple_choice: 'Multiple Choice',
    true_false: 'True / False',
    identification: 'Identification',
    coding: 'Coding',
    essay: 'Essay',
};

interface Props {
    open: boolean;
    onClose: () => void;
    onImport: (items: BankItem[]) => void;
}

export default function QuestionBankPicker({ open, onClose, onImport }: Props) {
    const [items, setItems] = useState<BankItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [selected, setSelected] = useState<Set<number>>(new Set());

    const fetchItems = async () => {
        setLoading(true);
        try {
            const params: Record<string, string> = {};
            if (search) params.q = search;
            if (typeFilter) params.type = typeFilter;
            const resp = await axios.get(route('question-bank.search'), { params });
            setItems(resp.data.items);
        } catch {
            // silently ignore
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (open) {
            setSelected(new Set());
            fetchItems();
        }
    }, [open]);

    useEffect(() => {
        if (open) {
            const timer = setTimeout(fetchItems, 300);
            return () => clearTimeout(timer);
        }
    }, [search, typeFilter]);

    const toggle = (id: number) => {
        setSelected((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const handleImport = () => {
        const toImport = items.filter((item) => selected.has(item.id));
        onImport(toImport);
        onClose();
    };

    return (
        <Modal show={open} onClose={onClose} maxWidth="xl">
            <div className="flex items-center justify-between border-b-3 border-foreground p-4">
                <div className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    <h2 className="text-lg font-bold">Import from Question Bank</h2>
                </div>
                <span className="text-sm text-muted-foreground">{selected.size} selected</span>
            </div>

            <div className="p-4 space-y-3">
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            className="pl-9"
                            placeholder="Search..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <Select value={typeFilter || 'all'} onValueChange={(v) => setTypeFilter(v === 'all' ? '' : v)}>
                        <SelectTrigger className="w-40">
                            <SelectValue placeholder="All types" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All types</SelectItem>
                            {Object.entries(TYPE_LABELS).map(([k, v]) => (
                                <SelectItem key={k} value={k}>{v}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="max-h-[50vh] overflow-y-auto space-y-2">
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : items.length === 0 ? (
                        <p className="text-center text-sm text-muted-foreground py-8">No questions found.</p>
                    ) : (
                        items.map((item) => (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => toggle(item.id)}
                                className={`w-full text-left border-3 p-3 transition-colors ${
                                    selected.has(item.id)
                                        ? 'border-primary bg-primary/5'
                                        : 'border-foreground hover:border-primary/50'
                                }`}
                            >
                                <div className="flex items-start gap-3">
                                    <div className={`mt-0.5 ${selected.has(item.id) ? 'text-primary' : 'text-muted-foreground'}`}>
                                        {TYPE_ICONS[item.type]}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm truncate">
                                            {item.content.question || item.content.title || '(no text)'}
                                        </p>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            <Badge variant="outline" className="text-xs">{TYPE_LABELS[item.type]}</Badge>
                                            {item.subject && <Badge variant="secondary" className="text-xs">{item.subject}</Badge>}
                                            <span className="text-xs text-muted-foreground">{item.points} pt{item.points !== 1 ? 's' : ''}</span>
                                        </div>
                                    </div>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>

            <div className="border-t-3 border-foreground p-4 flex justify-end gap-2">
                <Button variant="outline" onClick={onClose}>Cancel</Button>
                <Button onClick={handleImport} disabled={selected.size === 0}>
                    Import {selected.size > 0 ? `(${selected.size})` : ''}
                </Button>
            </div>
        </Modal>
    );
}
