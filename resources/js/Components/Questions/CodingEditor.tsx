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
    const baseCode: string = question.content.base_code ?? '';

    return (
        <div className="space-y-2">
            <Badge variant="outline">{language}</Badge>
            {baseCode.trim() && (
                <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Starter Code</p>
                    <pre className="border-3 border-foreground bg-muted p-3 text-sm font-mono overflow-x-auto whitespace-pre-wrap print:border print:bg-white">
                        <code>{baseCode}</code>
                    </pre>
                </div>
            )}
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
