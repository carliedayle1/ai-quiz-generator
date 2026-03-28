import { ButtonHTMLAttributes } from 'react';

export default function DangerButton({
    className = '',
    disabled,
    children,
    ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
    return (
        <button
            {...props}
            className={
                `inline-flex items-center border-3 border-foreground bg-destructive px-4 py-2 text-xs font-bold uppercase tracking-widest text-destructive-foreground shadow-brutal transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none focus:outline-none focus:ring-2 focus:ring-ring active:translate-x-[2px] active:translate-y-[2px] active:shadow-none ${
                    disabled && 'opacity-25'
                } ` + className
            }
            disabled={disabled}
        >
            {children}
        </button>
    );
}
