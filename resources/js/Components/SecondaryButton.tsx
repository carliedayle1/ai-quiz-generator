import { ButtonHTMLAttributes } from 'react';

export default function SecondaryButton({
    type = 'button',
    className = '',
    disabled,
    children,
    ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
    return (
        <button
            {...props}
            type={type}
            className={
                `inline-flex items-center border-3 border-foreground bg-secondary px-4 py-2 text-xs font-bold uppercase tracking-widest text-secondary-foreground shadow-brutal transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-25 ${
                    disabled && 'opacity-25'
                } ` + className
            }
            disabled={disabled}
        >
            {children}
        </button>
    );
}
