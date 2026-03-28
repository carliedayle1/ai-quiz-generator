export interface User {
    id: number;
    name: string;
    email: string;
    email_verified_at?: string;
    role: 'teacher' | 'student';
}

export interface ClassModel {
    id: number;
    user_id: number;
    name: string;
    description: string | null;
    invite_code: string;
    created_at: string;
    updated_at: string;
    teacher?: User;
    students?: User[];
    quizzes?: Quiz[];
    students_count?: number;
    quizzes_count?: number;
}

export interface Quiz {
    id: number;
    class_id: number;
    title: string;
    description: string | null;
    time_limit: number | null;
    is_published: boolean;
    created_at: string;
    updated_at: string;
    classModel?: ClassModel;
    questions?: Question[];
    submissions?: Submission[];
}

export interface Question {
    id: number;
    quiz_id: number;
    type: 'multiple_choice' | 'true_false' | 'identification' | 'coding' | 'essay';
    content: Record<string, any>;
    points: number;
    order: number;
}

export interface Submission {
    id: number;
    quiz_id: number;
    user_id: number;
    answers: Record<string, any> | null;
    score: number | null;
    earned_points: number | null;
    total_points: number | null;
    submitted_at: string | null;
    created_at: string;
    student?: User;
    quiz?: Quiz;
    exam_logs?: ExamLog[];
}

export interface ExamLog {
    id: number;
    submission_id: number;
    event_type: string;
    metadata: Record<string, any> | null;
    created_at: string;
}

export type PageProps<
    T extends Record<string, unknown> = Record<string, unknown>,
> = T & {
    auth: {
        user: User;
    };
};
