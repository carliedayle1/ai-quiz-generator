import { InertiaLinkProps, Link } from '@inertiajs/react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SidebarNavLink({
    active = false,
    collapsed = false,
    icon: Icon,
    className = '',
    children,
    ...props
}: InertiaLinkProps & {
    active?: boolean;
    collapsed?: boolean;
    icon: LucideIcon;
}) {
    return (
        <Link
            {...props}
            className={cn(
                'flex items-center gap-3 px-3 py-2.5 text-sm font-bold transition-all border-3',
                active
                    ? 'bg-primary text-primary-foreground border-foreground shadow-brutal-sm'
                    : 'border-transparent text-foreground hover:bg-muted hover:border-foreground hover:shadow-brutal-sm',
                collapsed && 'justify-center px-2',
                className
            )}
        >
            <Icon className="h-5 w-5 shrink-0" />
            {!collapsed && <span>{children}</span>}
        </Link>
    );
}
