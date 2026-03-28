import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { PageProps } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Users, GraduationCap, BookOpen, Shield, Clock } from 'lucide-react';

interface Stats {
    total_users: number;
    teachers: number;
    students: number;
    admins: number;
    pending_invitations: number;
}

export default function Dashboard({ stats }: PageProps<{ stats: Stats }>) {
    const statCards = [
        {
            label: 'Total Users',
            value: stats.total_users,
            icon: Users,
            borderColor: 'border-l-primary',
        },
        {
            label: 'Teachers',
            value: stats.teachers,
            icon: BookOpen,
            borderColor: 'border-l-success',
        },
        {
            label: 'Students',
            value: stats.students,
            icon: GraduationCap,
            borderColor: 'border-l-warning',
        },
        {
            label: 'Admins',
            value: stats.admins,
            icon: Shield,
            borderColor: 'border-l-destructive',
        },
        {
            label: 'Pending Invitations',
            value: stats.pending_invitations,
            icon: Clock,
            borderColor: 'border-l-secondary',
        },
    ];

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-bold leading-tight text-foreground">
                    Admin Dashboard
                </h2>
            }
        >
            <Head title="Admin Dashboard" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                        {statCards.map((stat) => (
                            <Card key={stat.label} className={`border-l-[6px] ${stat.borderColor}`}>
                                <CardHeader className="pb-2">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-sm font-medium text-muted-foreground">
                                            {stat.label}
                                        </CardTitle>
                                        <stat.icon className="h-5 w-5 text-muted-foreground" />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-4xl font-extrabold">{stat.value}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
