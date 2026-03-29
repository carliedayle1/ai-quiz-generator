import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { PageProps } from '@/types';
import { Button } from '@/Components/ui/button';
import { Card, CardContent } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { Input } from '@/Components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import { CheckSquare, Code, FileText, HelpCircle, Search, ToggleLeft, Trash2 } from 'lucide-react';
import { useState } from 'react';
import axios from 'axios';

interface BankItem {
    id: number;
    type: string;
    content: Record<string, any>;
    points: number;
    subject: string | null;
    difficulty: string;
    created_at: string;
}

interface PaginatedItems {
    data: BankItem[];
    current_page: number;
    last_page: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
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

const DIFFICULTY_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive'> = {
    easy: 'secondary',
    medium: 'default',
    hard: 'destructive',
};

export default function Index({
    items,
    subjects,
    filters,
}: PageProps<{ items: PaginatedItems; subjects: string[]; filters: Record<string, string> }>) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [type, setType] = useState(filters.type ?? '');
    const [subject, setSubject] = useState(filters.subject ?? '');

    const applyFilters = (overrides: Record<string, string> = {}) => {
        router.get(
            route('question-bank.index'),
            { search, type, subject, ...overrides },
            { preserveState: true, replace: true },
        );
    };

    const deleteItem = async (id: number) => {
        if (!confirm('Remove this question from your bank?')) return;
        await axios.delete(route('question-bank.destroy', id));
        router.reload({ only: ['items'] });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold leading-tight text-foreground">Question Bank</h2>
                    <Badge variant="outline">{items.total} item{items.total !== 1 ? 's' : ''}</Badge>
                </div>
            }
        >
            <Head title="Question Bank" />

            <div className="py-12">
                <div className="mx-auto max-w-5xl sm:px-6 lg:px-8 space-y-6">
                    {/* Filters */}
                    <div className="flex flex-wrap gap-3">
                        <div className="relative flex-1 min-w-48">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                className="pl-9"
                                placeholder="Search questions..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && applyFilters({ search: e.currentTarget.value })}
                            />
                        </div>

                        <Select value={type || 'all'} onValueChange={(v) => {
                            const val = v === 'all' ? '' : v;
                            setType(val);
                            applyFilters({ type: val });
                        }}>
                            <SelectTrigger className="w-44">
                                <SelectValue placeholder="All types" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All types</SelectItem>
                                {Object.entries(TYPE_LABELS).map(([k, v]) => (
                                    <SelectItem key={k} value={k}>{v}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {subjects.length > 0 && (
                            <Select value={subject || 'all'} onValueChange={(v) => {
                                const val = v === 'all' ? '' : v;
                                setSubject(val);
                                applyFilters({ subject: val });
                            }}>
                                <SelectTrigger className="w-44">
                                    <SelectValue placeholder="All subjects" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All subjects</SelectItem>
                                    {subjects.map((s) => (
                                        <SelectItem key={s} value={s}>{s}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    </div>

                    {/* Items */}
                    {items.data.length === 0 ? (
                        <div className="text-center py-16">
                            <FileText className="mx-auto h-10 w-10 text-muted-foreground" />
                            <p className="mt-3 text-muted-foreground">No questions in your bank yet.</p>
                            <p className="text-sm text-muted-foreground mt-1">
                                Save questions from the quiz editor to build your bank.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {items.data.map((item) => (
                                <Card key={item.id}>
                                    <CardContent className="py-4 px-5">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex flex-wrap items-center gap-2 mb-2">
                                                    <span className="text-muted-foreground">{TYPE_ICONS[item.type]}</span>
                                                    <Badge variant="outline" className="text-xs">
                                                        {TYPE_LABELS[item.type]}
                                                    </Badge>
                                                    <Badge variant={DIFFICULTY_VARIANTS[item.difficulty] ?? 'secondary'} className="text-xs capitalize">
                                                        {item.difficulty}
                                                    </Badge>
                                                    {item.subject && (
                                                        <Badge variant="secondary" className="text-xs">{item.subject}</Badge>
                                                    )}
                                                    <span className="text-xs text-muted-foreground">{item.points} pt{item.points !== 1 ? 's' : ''}</span>
                                                </div>
                                                <p className="text-sm text-foreground truncate">
                                                    {item.content.question || item.content.title || '(no question text)'}
                                                </p>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                                                onClick={() => deleteItem(item.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}

                    {/* Pagination */}
                    {items.last_page > 1 && (
                        <div className="flex justify-center gap-1">
                            {items.links.map((link, i) => (
                                <Button
                                    key={i}
                                    variant={link.active ? 'default' : 'outline'}
                                    size="sm"
                                    disabled={!link.url}
                                    onClick={() => link.url && router.visit(link.url)}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
