import { Question } from '@/types';
import { Card, CardContent } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import MultipleChoice from './MultipleChoice';
import TrueFalse from './TrueFalse';
import Identification from './Identification';
import CodingEditor from './CodingEditor';
import Essay from './Essay';

interface Props {
    question: Question;
    index: number;
    value: string;
    onChange: (value: string) => void;
    readOnly?: boolean;
}

const componentMap: Record<string, React.ComponentType<{ question: Question; value: string; onChange: (v: string) => void }>> = {
    multiple_choice: MultipleChoice,
    true_false: TrueFalse,
    identification: Identification,
    coding: CodingEditor,
    essay: Essay,
};

const typeLabels: Record<string, string> = {
    multiple_choice: 'Multiple Choice',
    true_false: 'True / False',
    identification: 'Identification',
    coding: 'Coding',
    essay: 'Essay',
};

export default function QuestionRenderer({ question, index, value, onChange, readOnly = false }: Props) {
    // section_header is rendered by the parent as a divider, not here
    if (question.type === 'section_header') return null;

    const Component = componentMap[question.type];

    if (!Component) {
        return (
            <Card>
                <CardContent className="pt-6">
                    <p className="text-destructive">Unknown question type: {question.type}</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardContent className="pt-6 space-y-4">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-muted-foreground">
                        Question {index + 1}
                    </span>
                    <Badge variant="outline">{typeLabels[question.type]}</Badge>
                    <span className="text-sm text-muted-foreground ml-auto">
                        {question.points} pt{question.points !== 1 ? 's' : ''}
                    </span>
                </div>
                <p className="text-foreground font-medium">{question.content.question}</p>
                <Component question={question} value={value} onChange={onChange} />
            </CardContent>
        </Card>
    );
}
