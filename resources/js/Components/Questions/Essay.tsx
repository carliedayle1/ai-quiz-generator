import { Question } from '@/types';
import { Textarea } from '@/Components/ui/textarea';
import { useState } from 'react';

interface Props {
    question: Question;
    value: string;
    onChange: (value: string) => void;
}

export default function Essay({ question, value, onChange }: Props) {
    const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0;

    return (
        <div className="space-y-2">
            <Textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="Write your essay response here..."
                className="min-h-[200px]"
            />
            <p className="text-sm text-muted-foreground text-right">
                {wordCount} word{wordCount !== 1 ? 's' : ''}
            </p>
        </div>
    );
}
