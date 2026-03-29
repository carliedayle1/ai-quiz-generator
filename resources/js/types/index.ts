export interface User {
    id: number;
    first_name: string;
    last_name: string;
    id_number: string;
    email: string;
    email_verified_at?: string;
    role: 'teacher' | 'student' | 'admin';
    created_at?: string;
    updated_at?: string;
}

export function fullName(user: Pick<User, 'first_name' | 'last_name'>): string {
    return `${user.first_name} ${user.last_name}`;
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
    available_from: string | null;
    available_until: string | null;
    due_date: string | null;
    status: 'draft' | 'published' | 'scheduled' | 'closed';
    allow_partial_credit: boolean;
    created_at: string;
    updated_at: string;
    classModel?: ClassModel;
    questions?: Question[];
    submissions?: Submission[];
}

export interface Question {
    id: number;
    quiz_id: number;
    type: 'multiple_choice' | 'true_false' | 'identification' | 'coding' | 'essay' | 'section_header';
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

export interface Invitation {
    id: number;
    invited_by: number;
    email: string;
    role: 'teacher' | 'student' | 'admin';
    token: string;
    expires_at: string;
    accepted_at: string | null;
    created_at: string;
    updated_at: string;
    invited_by_user?: User;
}

export interface BulkInviteResults {
    sent: number;
    skipped: Array<{ email: string; reason: string }>;
}

export type PageProps<
    T extends Record<string, unknown> = Record<string, unknown>,
> = T & {
    auth: {
        user: User;
    };
    flash: {
        success?: string;
        bulk_results?: BulkInviteResults;
    };
    unread_notifications: number;
};
