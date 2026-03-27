import { Question } from '@/types';
import { Input } from '@/Components/ui/input';

interface Props {
    question: Question;
    value: string;
    onChange: (value: string) => void;
}

export default function Identification({ question, value, onChange }: Props) {
    return (
        <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Type your answer here..."
            className="max-w-md"
        />
    );
}
