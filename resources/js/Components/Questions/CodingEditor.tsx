import { Question } from '@/types';
import { Textarea } from '@/Components/ui/textarea';
import { Badge } from '@/Components/ui/badge';

interface Props {
    question: Question;
    value: string;
    onChange: (value: string) => void;
}

export default function CodingEditor({ question, value, onChange }: Props) {
    const language = question.content.language || 'code';

    return (
        <div className="space-y-2">
            <Badge variant="outline">{language}</Badge>
            <Textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={`Write your ${language} code here...`}
                className="font-mono text-sm min-h-[200px]"
                spellCheck={false}
            />
        </div>
    );
}
