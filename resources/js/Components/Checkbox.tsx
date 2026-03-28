import { InputHTMLAttributes } from 'react';

export default function Checkbox({
    className = '',
    ...props
}: InputHTMLAttributes<HTMLInputElement>) {
    return (
        <input
            {...props}
            type="checkbox"
            className={
                'border-3 border-foreground text-primary shadow-none focus:ring-2 focus:ring-ring ' +
                className
            }
        />
    );
}
