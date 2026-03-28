import ApplicationLogo from '@/Components/ApplicationLogo';
import SidebarNavLink from '@/Components/SidebarNavLink';
import ThemeToggle from '@/Components/ThemeToggle';
import { Link, usePage } from '@inertiajs/react';
import { PropsWithChildren, ReactNode, useEffect, useState } from 'react';
import {
    LayoutDashboard,
    GraduationCap,
    User,
    LogOut,
    PanelLeftClose,
    PanelLeftOpen,
    Menu,
    X,
    Shield,
    Users as UsersIcon,
    Mail,
} from 'lucide-react';
import { Button } from '@/Components/ui/button';
import { cn } from '@/lib/utils';

export default function Authenticated({
    header,
    children,
}: PropsWithChildren<{ header?: ReactNode }>) {
    const user = usePage().props.auth.user;

    const [collapsed, setCollapsed] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('sidebar-collapsed') === 'true';
        }
        return false;
    });

    const [mobileOpen, setMobileOpen] = useState(false);

    useEffect(() => {
        localStorage.setItem('sidebar-collapsed', String(collapsed));
    }, [collapsed]);

    useEffect(() => {
        if (mobileOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [mobileOpen]);

    const navLinks = (
        <>
            <SidebarNavLink
                href={route('dashboard')}
                active={route().current('dashboard')}
                icon={LayoutDashboard}
                collapsed={collapsed}
            >
                Dashboard
            </SidebarNavLink>
            <SidebarNavLink
                href={route('classes.index')}
                active={route().current('classes.*') || route().current('quizzes.*')}
                icon={GraduationCap}
                collapsed={collapsed}
            >
                Classes
            </SidebarNavLink>
            {user.role === 'admin' && (
                <>
                    <SidebarNavLink
                        href={route('admin.dashboard')}
                        active={route().current('admin.dashboard')}
                        icon={Shield}
                        collapsed={collapsed}
                    >
                        Admin
                    </SidebarNavLink>
                    <SidebarNavLink
                        href={route('admin.users')}
                        active={route().current('admin.users')}
                        icon={UsersIcon}
                        collapsed={collapsed}
                    >
                        Users
                    </SidebarNavLink>
                    <SidebarNavLink
                        href={route('admin.invitations')}
                        active={route().current('admin.invitations')}
                        icon={Mail}
                        collapsed={collapsed}
                    >
                        Invitations
                    </SidebarNavLink>
                </>
            )}
        </>
    );

    const mobileNavLinks = (
        <>
            <SidebarNavLink
                href={route('dashboard')}
                active={route().current('dashboard')}
                icon={LayoutDashboard}
                collapsed={false}
            >
                Dashboard
            </SidebarNavLink>
            <SidebarNavLink
                href={route('classes.index')}
                active={route().current('classes.*') || route().current('quizzes.*')}
                icon={GraduationCap}
                collapsed={false}
            >
                Classes
            </SidebarNavLink>
            {user.role === 'admin' && (
                <>
                    <SidebarNavLink
                        href={route('admin.dashboard')}
                        active={route().current('admin.dashboard')}
                        icon={Shield}
                        collapsed={false}
                    >
                        Admin
                    </SidebarNavLink>
                    <SidebarNavLink
                        href={route('admin.users')}
                        active={route().current('admin.users')}
                        icon={UsersIcon}
                        collapsed={false}
                    >
                        Users
                    </SidebarNavLink>
                    <SidebarNavLink
                        href={route('admin.invitations')}
                        active={route().current('admin.invitations')}
                        icon={Mail}
                        collapsed={false}
                    >
                        Invitations
                    </SidebarNavLink>
                </>
            )}
        </>
    );

    const sidebar = (
        <aside
            className={cn(
                'fixed inset-y-0 left-0 z-30 hidden md:flex flex-col border-r-3 border-foreground bg-card transition-all duration-200',
                collapsed ? 'w-16' : 'w-64'
            )}
        >
            {/* Logo */}
            <div className={cn(
                'flex items-center border-b-3 border-foreground h-16',
                collapsed ? 'justify-center px-2' : 'px-4 gap-3'
            )}>
                <Link href="/">
                    <ApplicationLogo className="h-10 w-10 shrink-0" />
                </Link>
                {!collapsed && (
                    <Link href="/" className="font-extrabold text-lg text-foreground tracking-tight">
                        QuizAI
                    </Link>
                )}
            </div>

            {/* Nav links */}
            <nav className="flex-1 flex flex-col gap-1 p-2 overflow-y-auto">
                {navLinks}
            </nav>

            {/* Bottom section */}
            <div className="border-t-3 border-foreground p-2 space-y-1">
                <div className={cn('flex items-center', collapsed ? 'justify-center' : 'justify-between px-1')}>
                    <ThemeToggle />
                    {!collapsed && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setCollapsed(true)}
                        >
                            <PanelLeftClose className="h-5 w-5" />
                        </Button>
                    )}
                    {collapsed && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setCollapsed(false)}
                            className="hidden"
                        >
                            <PanelLeftOpen className="h-5 w-5" />
                        </Button>
                    )}
                </div>

                <SidebarNavLink
                    href={route('profile.edit')}
                    active={route().current('profile.edit')}
                    icon={User}
                    collapsed={collapsed}
                >
                    {user.name}
                </SidebarNavLink>

                <SidebarNavLink
                    href={route('logout')}
                    method="post"
                    as="button"
                    active={false}
                    icon={LogOut}
                    collapsed={collapsed}
                >
                    Log Out
                </SidebarNavLink>

                {collapsed && (
                    <div className="flex justify-center pt-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setCollapsed(false)}
                        >
                            <PanelLeftOpen className="h-5 w-5" />
                        </Button>
                    </div>
                )}
            </div>
        </aside>
    );

    const mobileOverlay = (
        <>
            {/* Mobile hamburger button */}
            <div className="fixed top-0 left-0 right-0 z-20 flex md:hidden items-center h-14 px-4 border-b-3 border-foreground bg-card">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setMobileOpen(true)}
                >
                    <Menu className="h-6 w-6" />
                </Button>
                <Link href="/" className="flex items-center gap-2 ml-2">
                    <ApplicationLogo className="h-8 w-8" />
                    <span className="font-extrabold text-lg">QuizAI</span>
                </Link>
                <div className="ml-auto">
                    <ThemeToggle />
                </div>
            </div>

            {/* Overlay */}
            {mobileOpen && (
                <div className="fixed inset-0 z-40 md:hidden">
                    <div
                        className="absolute inset-0 bg-foreground/50"
                        onClick={() => setMobileOpen(false)}
                    />
                    <aside className="absolute inset-y-0 left-0 w-72 border-r-3 border-foreground bg-card flex flex-col animate-in slide-in-from-left duration-200">
                        <div className="flex items-center justify-between h-14 px-4 border-b-3 border-foreground">
                            <Link href="/" className="flex items-center gap-2">
                                <ApplicationLogo className="h-8 w-8" />
                                <span className="font-extrabold text-lg">QuizAI</span>
                            </Link>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setMobileOpen(false)}
                            >
                                <X className="h-5 w-5" />
                            </Button>
                        </div>

                        <nav className="flex-1 flex flex-col gap-1 p-2 overflow-y-auto">
                            {mobileNavLinks}
                        </nav>

                        <div className="border-t-3 border-foreground p-2 space-y-1">
                            <SidebarNavLink
                                href={route('profile.edit')}
                                active={route().current('profile.edit')}
                                icon={User}
                                collapsed={false}
                            >
                                {user.name}
                            </SidebarNavLink>
                            <SidebarNavLink
                                href={route('logout')}
                                method="post"
                                as="button"
                                active={false}
                                icon={LogOut}
                                collapsed={false}
                            >
                                Log Out
                            </SidebarNavLink>
                        </div>
                    </aside>
                </div>
            )}
        </>
    );

    return (
        <div className="min-h-screen bg-background">
            {sidebar}
            {mobileOverlay}

            {/* Main content */}
            <div className={cn(
                'transition-all duration-200',
                'md:ml-64',
                collapsed && 'md:ml-16',
                'pt-14 md:pt-0'
            )}>
                {header && (
                    <header className="border-b-3 border-foreground bg-card">
                        <div className="px-4 py-6 sm:px-6 lg:px-8">
                            {header}
                        </div>
                    </header>
                )}

                <main>{children}</main>
            </div>
        </div>
    );
}
