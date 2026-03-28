import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { Button } from '../button';

describe('Button', () => {
    it('renders with default variant', () => {
        render(<Button>Click me</Button>);
        const btn = screen.getByRole('button', { name: 'Click me' });
        expect(btn).toBeInTheDocument();
        expect(btn).toHaveClass('bg-primary');
        expect(btn).toHaveClass('text-primary-foreground');
    });

    it('renders with destructive variant applying correct class', () => {
        render(<Button variant="destructive">Delete</Button>);
        const btn = screen.getByRole('button', { name: 'Delete' });
        expect(btn).toHaveClass('bg-destructive');
        expect(btn).toHaveClass('text-destructive-foreground');
    });

    it('renders with secondary variant', () => {
        render(<Button variant="secondary">Secondary</Button>);
        const btn = screen.getByRole('button', { name: 'Secondary' });
        expect(btn).toHaveClass('bg-secondary');
        expect(btn).toHaveClass('text-secondary-foreground');
    });

    it('fires onClick handler when clicked', () => {
        const handleClick = vi.fn();
        render(<Button onClick={handleClick}>Submit</Button>);
        fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
        expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('does not fire onClick when disabled', () => {
        const handleClick = vi.fn();
        render(
            <Button disabled onClick={handleClick}>
                Disabled
            </Button>,
        );
        const btn = screen.getByRole('button', { name: 'Disabled' });
        fireEvent.click(btn);
        expect(handleClick).not.toHaveBeenCalled();
        expect(btn).toBeDisabled();
        expect(btn).toHaveClass('disabled:opacity-50');
    });

    it('renders as child element when asChild is true', () => {
        render(
            <Button asChild>
                <a href="/home">Go Home</a>
            </Button>,
        );
        // With asChild the Slot renders the child <a> but merges button classes onto it
        const link = screen.getByRole('link', { name: 'Go Home' });
        expect(link).toBeInTheDocument();
        expect(link).toHaveAttribute('href', '/home');
        // Button class should be forwarded onto the <a>
        expect(link).toHaveClass('bg-primary');
    });

    it('applies custom className alongside variant classes', () => {
        render(<Button className="my-custom-class">Styled</Button>);
        const btn = screen.getByRole('button', { name: 'Styled' });
        expect(btn).toHaveClass('my-custom-class');
        expect(btn).toHaveClass('bg-primary');
    });

    it('renders with outline variant', () => {
        render(<Button variant="outline">Outline</Button>);
        expect(screen.getByRole('button', { name: 'Outline' })).toHaveClass('bg-background');
    });

    it('renders with ghost variant', () => {
        render(<Button variant="ghost">Ghost</Button>);
        expect(screen.getByRole('button', { name: 'Ghost' })).toHaveClass('border-transparent');
    });
});
