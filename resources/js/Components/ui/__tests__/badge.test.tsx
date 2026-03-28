import { render, screen } from '@testing-library/react';
import { Badge } from '../badge';

describe('Badge', () => {
    it('renders with default variant and displays text', () => {
        render(<Badge>Active</Badge>);
        const badge = screen.getByText('Active');
        expect(badge).toBeInTheDocument();
        expect(badge).toHaveClass('bg-primary');
        expect(badge).toHaveClass('text-primary-foreground');
    });

    it('renders with success variant', () => {
        render(<Badge variant="success">Passed</Badge>);
        const badge = screen.getByText('Passed');
        expect(badge).toHaveClass('bg-success');
        expect(badge).toHaveClass('text-success-foreground');
    });

    it('renders with warning variant', () => {
        render(<Badge variant="warning">Pending</Badge>);
        const badge = screen.getByText('Pending');
        expect(badge).toHaveClass('bg-warning');
        expect(badge).toHaveClass('text-warning-foreground');
    });

    it('renders with destructive variant', () => {
        render(<Badge variant="destructive">Failed</Badge>);
        const badge = screen.getByText('Failed');
        expect(badge).toHaveClass('bg-destructive');
        expect(badge).toHaveClass('text-destructive-foreground');
    });

    it('renders with secondary variant', () => {
        render(<Badge variant="secondary">Draft</Badge>);
        const badge = screen.getByText('Draft');
        expect(badge).toHaveClass('bg-secondary');
        expect(badge).toHaveClass('text-secondary-foreground');
    });

    it('renders with outline variant', () => {
        render(<Badge variant="outline">Outline</Badge>);
        const badge = screen.getByText('Outline');
        expect(badge).toHaveClass('bg-background');
        expect(badge).toHaveClass('text-foreground');
    });

    it('displays text content correctly', () => {
        render(<Badge>75%</Badge>);
        expect(screen.getByText('75%')).toBeInTheDocument();
    });

    it('applies base classes regardless of variant', () => {
        render(<Badge>Base</Badge>);
        const badge = screen.getByText('Base');
        expect(badge).toHaveClass('inline-flex');
        expect(badge).toHaveClass('items-center');
        expect(badge).toHaveClass('border-2');
        expect(badge).toHaveClass('border-foreground');
    });

    it('applies custom className', () => {
        render(<Badge className="mt-2">Custom</Badge>);
        expect(screen.getByText('Custom')).toHaveClass('mt-2');
    });

    it('renders as a div element', () => {
        const { container } = render(<Badge>Check</Badge>);
        expect(container.firstChild?.nodeName).toBe('DIV');
    });
});
