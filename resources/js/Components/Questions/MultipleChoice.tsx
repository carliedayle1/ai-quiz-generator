import { Question } from '@/types';
import { Label } from '@/Components/ui/label';

interface Props {
    question: Question;
    value: string;
    onChange: (value: string) => void;
}

export default function MultipleChoice({ question, value, onChange }: Props) {
    const options: string[] = question.content.options || [];

    return (
        <div className="space-y-3">
            {options.map((option, index) => (
                <label
                    key={index}
                    className={`flex items-center gap-3 border-3 border-foreground p-3 cursor-pointer transition-colors ${
                        value === option
                            ? 'border-primary bg-primary/5'
                            : 'border-foreground hover:bg-accent'
                    }`}
                >
                    <input
                        type="radio"
                        name={`question-${question.id}`}
                        value={option}
                        checked={value === option}
                        onChange={() => onChange(option)}
                        className="text-primary focus:ring-primary"
                    />
                    <span className="text-sm text-foreground">
                        {String.fromCharCode(65 + index)}. {option}
                    </span>
                </label>
            ))}
        </div>
    );
}
