import { Question } from '@/types';
import { Button } from '@/Components/ui/button';

interface Props {
    question: Question;
    value: string;
    onChange: (value: string) => void;
}

export default function TrueFalse({ question, value, onChange }: Props) {
    return (
        <div className="flex gap-4">
            <Button
                type="button"
                variant={value === 'true' ? 'default' : 'outline'}
                className="flex-1"
                onClick={() => onChange('true')}
            >
                True
            </Button>
            <Button
                type="button"
                variant={value === 'false' ? 'default' : 'outline'}
                className="flex-1"
                onClick={() => onChange('false')}
            >
                False
            </Button>
        </div>
    );
}
