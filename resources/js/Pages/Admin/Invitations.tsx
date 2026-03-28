import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { Invitation, PageProps, User } from '@/types';
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
import { Send, Trash2 } from 'lucide-react';
import { FormEventHandler } from 'react';

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
        case 'admin':
            return 'destructive' as const;
        case 'teacher':
            return 'default' as const;
        case 'student':
            return 'secondary' as const;
        default:
            return 'outline' as const;
    }
}

export default function Invitations({ invitations }: PageProps<{ invitations: PaginatedInvitations }>) {
    const form = useForm({
        email: '',
        role: 'teacher',
    });

    const submitInvitation: FormEventHandler = (e) => {
        e.preventDefault();
        form.post(route('admin.invitations.send'), {
            onSuccess: () => form.reset(),
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
                    {/* Send Invitation Form */}
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
                                                        <Badge variant={status.variant}>
                                                            {status.label}
                                                        </Badge>
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
