import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { BulkInviteResults, Invitation, PageProps, User } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/Components/ui/select';
import { Download, Send, Trash2, Upload, CheckCircle2, AlertTriangle } from 'lucide-react';
import { FormEventHandler, useRef, useState } from 'react';

interface InvitationWithRelation extends Invitation {
    invited_by_user?: User;
}

interface PaginatedInvitations {
    data: InvitationWithRelation[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
}

function getStatus(invitation: InvitationWithRelation): { label: string; variant: 'success' | 'destructive' | 'warning' } {
    if (invitation.accepted_at) {
        return { label: 'Accepted', variant: 'success' };
    }
    if (new Date(invitation.expires_at) < new Date()) {
        return { label: 'Expired', variant: 'destructive' };
    }
    return { label: 'Pending', variant: 'warning' };
}

function roleBadgeVariant(role: string) {
    switch (role) {
        case 'admin':   return 'destructive' as const;
        case 'teacher': return 'default' as const;
        case 'student': return 'secondary' as const;
        default:        return 'outline' as const;
    }
}

export default function Invitations({ invitations }: PageProps<{ invitations: PaginatedInvitations }>) {
    const { flash } = usePage<PageProps>().props;
    const bulkResults: BulkInviteResults | undefined = flash?.bulk_results;

    const form = useForm({ email: '', role: 'teacher' });
    const bulkForm = useForm<{ file: File | null }>({ file: null });

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [fileName, setFileName] = useState<string>('');

    const submitInvitation: FormEventHandler = (e) => {
        e.preventDefault();
        form.post(route('admin.invitations.send'), {
            onSuccess: () => form.reset(),
        });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] ?? null;
        bulkForm.setData('file', file);
        setFileName(file?.name ?? '');
    };

    const submitBulk: FormEventHandler = (e) => {
        e.preventDefault();
        if (!bulkForm.data.file) return;
        bulkForm.post(route('admin.invitations.bulk'), {
            forceFormData: true,
            onSuccess: () => {
                bulkForm.reset();
                setFileName('');
                if (fileInputRef.current) fileInputRef.current.value = '';
            },
        });
    };

    const revokeInvitation = (id: number) => {
        router.delete(route('admin.invitations.revoke', id));
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-bold leading-tight text-foreground">
                    Invitations
                </h2>
            }
        >
            <Head title="Invitations" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8 space-y-6">

                    {/* Single Invite Form */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Send Invitation</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={submitInvitation} className="flex flex-col sm:flex-row gap-4 items-end">
                                <div className="grid gap-2 flex-1">
                                    <Label htmlFor="email">Email Address</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={form.data.email}
                                        onChange={(e) => form.setData('email', e.target.value)}
                                        placeholder="user@example.com"
                                    />
                                    {form.errors.email && (
                                        <p className="text-sm text-destructive">{form.errors.email}</p>
                                    )}
                                </div>
                                <div className="grid gap-2 w-full sm:w-48">
                                    <Label htmlFor="role">Role</Label>
                                    <Select
                                        value={form.data.role}
                                        onValueChange={(value) => form.setData('role', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="teacher">Teacher</SelectItem>
                                            <SelectItem value="student">Student</SelectItem>
                                            <SelectItem value="admin">Admin</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Button type="submit" disabled={form.processing}>
                                    <Send className="mr-2 h-4 w-4" />
                                    Send
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Bulk Import */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Bulk Import</CardTitle>
                            <a href={route('admin.invitations.sample')}>
                                <Button variant="outline" size="sm" type="button">
                                    <Download className="mr-2 h-4 w-4" />
                                    Download Template
                                </Button>
                            </a>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm text-muted-foreground">
                                Upload a <strong>CSV</strong> or <strong>Excel</strong> file with two columns:{' '}
                                <code className="rounded bg-muted px-1 py-0.5 text-xs font-mono">email</code> and{' '}
                                <code className="rounded bg-muted px-1 py-0.5 text-xs font-mono">role</code>.
                                Valid roles: <em>teacher</em>, <em>student</em>, <em>admin</em>.
                            </p>

                            <form onSubmit={submitBulk} className="flex flex-col sm:flex-row gap-4 items-end">
                                <div className="flex-1 grid gap-2">
                                    <Label>File</Label>
                                    <div
                                        className="flex items-center gap-3 border-2 border-dashed border-border px-4 py-3 cursor-pointer hover:border-primary transition-colors"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        <Upload className="h-5 w-5 text-muted-foreground shrink-0" />
                                        <span className="text-sm text-muted-foreground truncate">
                                            {fileName || 'Click to choose a CSV or Excel file…'}
                                        </span>
                                    </div>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept=".csv,.xlsx,.xls,.txt"
                                        className="hidden"
                                        onChange={handleFileChange}
                                    />
                                    {bulkForm.errors.file && (
                                        <p className="text-sm text-destructive">{bulkForm.errors.file}</p>
                                    )}
                                </div>
                                <Button type="submit" disabled={bulkForm.processing || !bulkForm.data.file}>
                                    <Upload className="mr-2 h-4 w-4" />
                                    {bulkForm.processing ? 'Importing…' : 'Import'}
                                </Button>
                            </form>

                            {/* Bulk Results */}
                            {bulkResults && (
                                <div className="space-y-3 pt-2">
                                    <div className="flex items-center gap-2 border-2 border-foreground bg-success/10 px-4 py-3">
                                        <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
                                        <span className="text-sm font-semibold">
                                            {bulkResults.sent} invitation{bulkResults.sent !== 1 ? 's' : ''} sent successfully.
                                        </span>
                                    </div>

                                    {bulkResults.skipped.length > 0 && (
                                        <div className="border-2 border-foreground">
                                            <div className="flex items-center gap-2 bg-warning/10 px-4 py-2 border-b-2 border-foreground">
                                                <AlertTriangle className="h-4 w-4 text-warning shrink-0" />
                                                <span className="text-sm font-bold">
                                                    {bulkResults.skipped.length} row{bulkResults.skipped.length !== 1 ? 's' : ''} skipped
                                                </span>
                                            </div>
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-sm">
                                                    <thead>
                                                        <tr className="border-b-2 border-foreground bg-muted">
                                                            <th className="text-left py-2 px-4 font-bold">Email</th>
                                                            <th className="text-left py-2 px-4 font-bold">Reason</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {bulkResults.skipped.map((row, i) => (
                                                            <tr key={i} className="border-b border-border last:border-0">
                                                                <td className="py-2 px-4 font-mono text-xs">{row.email}</td>
                                                                <td className="py-2 px-4 text-muted-foreground">{row.reason}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Invitations Table */}
                    <Card>
                        <CardHeader>
                            <CardTitle>All Invitations ({invitations.total})</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b-3 border-foreground">
                                            <th className="text-left py-3 px-4 font-bold">Email</th>
                                            <th className="text-left py-3 px-4 font-bold">Role</th>
                                            <th className="text-left py-3 px-4 font-bold">Status</th>
                                            <th className="text-left py-3 px-4 font-bold">Invited By</th>
                                            <th className="text-left py-3 px-4 font-bold">Created</th>
                                            <th className="text-right py-3 px-4 font-bold">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {invitations.data.map((invitation) => {
                                            const status = getStatus(invitation);
                                            const isPending = status.label === 'Pending';
                                            return (
                                                <tr key={invitation.id} className="border-b border-border">
                                                    <td className="py-3 px-4 font-medium">{invitation.email}</td>
                                                    <td className="py-3 px-4">
                                                        <Badge variant={roleBadgeVariant(invitation.role)}>
                                                            {invitation.role}
                                                        </Badge>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <Badge variant={status.variant}>{status.label}</Badge>
                                                    </td>
                                                    <td className="py-3 px-4 text-muted-foreground">
                                                        {invitation.invited_by_user?.name ?? 'Unknown'}
                                                    </td>
                                                    <td className="py-3 px-4 text-muted-foreground">
                                                        {new Date(invitation.created_at).toLocaleDateString()}
                                                    </td>
                                                    <td className="py-3 px-4 text-right">
                                                        {isPending && (
                                                            <Button
                                                                variant="destructive"
                                                                size="sm"
                                                                onClick={() => revokeInvitation(invitation.id)}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {invitations.last_page > 1 && (
                                <div className="flex items-center justify-center gap-2 mt-6">
                                    {invitations.links.map((link, i) => (
                                        <Button
                                            key={i}
                                            variant={link.active ? 'default' : 'outline'}
                                            size="sm"
                                            disabled={!link.url}
                                            onClick={() => link.url && router.get(link.url)}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                </div>
            </div>
        </AuthenticatedLayout>
    );
}
