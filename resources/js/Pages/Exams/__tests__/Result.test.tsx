import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';

// Mock Inertia
vi.mock('@inertiajs/react', () => ({
    usePage: () => ({
        props: { auth: { user: { id: 1, name: 'Test Teacher', role: 'student' } } },
    }),
    Link: ({ children, href }: any) => <a href={href}>{children}</a>,
    router: { get: vi.fn(), post: vi.fn() },
    Head: ({ title }: any) => <title>{title}</title>,
}));

// Mock axios
vi.mock('axios', () => ({
    default: { post: vi.fn().mockResolvedValue({ data: {} }), get: vi.fn() },
}));

// Mock Ziggy route helper — supports route('name') and route().current('name')
const routeMock = Object.assign(
    (name?: string, _params?: any) => (name ? `/${name}` : ''),
    { current: (_name?: string) => false }
);
vi.stubGlobal('route', routeMock);

// Mock AuthenticatedLayout to avoid needing Ziggy/sidebar context
vi.mock('@/Layouts/AuthenticatedLayout', () => ({
    default: ({ children, header }: any) => (
        <div>
            {header && <div data-testid="page-header">{header}</div>}
            <main>{children}</main>
        </div>
    ),
}));

import Result from '../Result';
import { Submission } from '@/types';

// Minimal submission factory
function makeSubmission(overrides: Partial<Submission> = {}): Submission {
    return {
        id: 1,
        quiz_id: 10,
        user_id: 2,
        answers: {},
        score: 75,
        earned_points: 15,
        total_points: 20,
        submitted_at: '2026-01-01T10:00:00Z',
        created_at: '2026-01-01T09:00:00Z',
        student: { id: 2, name: 'Jane Student', email: 'jane@example.com', role: 'student' },
        quiz: {
            id: 10,
            class_id: 1,
            title: 'JavaScript Fundamentals',
            description: null,
            time_limit: null,
            is_published: true,
            created_at: '2026-01-01T00:00:00Z',
            updated_at: '2026-01-01T00:00:00Z',
            questions: [],
        },
        exam_logs: [],
        ...overrides,
    };
}

describe('Result page', () => {
    it('shows the score as a fraction (earned_points/total_points)', () => {
        render(<Result submission={makeSubmission()} />);
        // The component renders "15/20" (no spaces around slash per the template)
        expect(screen.getByText('15/20')).toBeInTheDocument();
    });

    it('shows the percentage score', () => {
        render(<Result submission={makeSubmission({ score: 75 })} />);
        expect(screen.getByText('75%')).toBeInTheDocument();
    });

    it('shows "Pending" when score is null', () => {
        render(<Result submission={makeSubmission({ score: null, earned_points: null, total_points: null })} />);
        expect(screen.getByText('Pending')).toBeInTheDocument();
    });

    it('shows the quiz title', () => {
        render(<Result submission={makeSubmission()} />);
        expect(screen.getByText('JavaScript Fundamentals')).toBeInTheDocument();
    });

    it('shows "Your Results" heading for a student user', () => {
        render(<Result submission={makeSubmission()} />);
        expect(screen.getByText('Your Results')).toBeInTheDocument();
    });

    it('does not show fraction when earned_points is null', () => {
        render(<Result submission={makeSubmission({ score: null, earned_points: null, total_points: null })} />);
        // No fraction element should appear
        const fraction = screen.queryByText(/\/\d+/);
        expect(fraction).toBeNull();
    });

    it('renders the question list for multiple_choice questions', () => {
        const submission = makeSubmission({
            answers: { 101: 'Paris' },
            quiz: {
                id: 10,
                class_id: 1,
                title: 'Geography Quiz',
                description: null,
                time_limit: null,
                is_published: true,
                created_at: '2026-01-01T00:00:00Z',
                updated_at: '2026-01-01T00:00:00Z',
                questions: [
                    {
                        id: 101,
                        quiz_id: 10,
                        type: 'multiple_choice',
                        points: 5,
                        order: 1,
                        content: {
                            question: 'What is the capital of France?',
                            options: ['London', 'Berlin', 'Paris', 'Madrid'],
                            correct_answer: 'Paris',
                        },
                    },
                ],
            },
        });

        render(<Result submission={submission} />);
        expect(screen.getByText('What is the capital of France?')).toBeInTheDocument();
        expect(screen.getByText('Q1.')).toBeInTheDocument();
    });

    it('shows the student answer in the question review', () => {
        const submission = makeSubmission({
            answers: { 101: 'Paris' },
            quiz: {
                id: 10,
                class_id: 1,
                title: 'Geography Quiz',
                description: null,
                time_limit: null,
                is_published: true,
                created_at: '2026-01-01T00:00:00Z',
                updated_at: '2026-01-01T00:00:00Z',
                questions: [
                    {
                        id: 101,
                        quiz_id: 10,
                        type: 'multiple_choice',
                        points: 5,
                        order: 1,
                        content: {
                            question: 'What is the capital of France?',
                            options: ['London', 'Berlin', 'Paris', 'Madrid'],
                            correct_answer: 'Paris',
                        },
                    },
                ],
            },
        });

        render(<Result submission={submission} />);
        expect(screen.getByText('Paris')).toBeInTheDocument();
    });

    it('shows "(no answer)" when student did not answer a question', () => {
        const submission = makeSubmission({
            answers: {},
            quiz: {
                id: 10,
                class_id: 1,
                title: 'Test Quiz',
                description: null,
                time_limit: null,
                is_published: true,
                created_at: '2026-01-01T00:00:00Z',
                updated_at: '2026-01-01T00:00:00Z',
                questions: [
                    {
                        id: 102,
                        quiz_id: 10,
                        type: 'identification',
                        points: 3,
                        order: 1,
                        content: {
                            question: 'Name the process of photosynthesis.',
                            correct_answers: ['photosynthesis'],
                        },
                    },
                ],
            },
        });

        render(<Result submission={submission} />);
        expect(screen.getByText('(no answer)')).toBeInTheDocument();
    });

    it('shows question point value', () => {
        const submission = makeSubmission({
            answers: {},
            quiz: {
                id: 10,
                class_id: 1,
                title: 'Point Test',
                description: null,
                time_limit: null,
                is_published: true,
                created_at: '2026-01-01T00:00:00Z',
                updated_at: '2026-01-01T00:00:00Z',
                questions: [
                    {
                        id: 103,
                        quiz_id: 10,
                        type: 'true_false',
                        points: 2,
                        order: 1,
                        content: {
                            question: 'The sky is blue.',
                            correct_answer: true,
                        },
                    },
                ],
            },
        });

        render(<Result submission={submission} />);
        expect(screen.getByText('2 pts')).toBeInTheDocument();
    });

    it('shows manual grading notice for essay questions', () => {
        const submission = makeSubmission({
            answers: { 104: 'My essay answer here.' },
            quiz: {
                id: 10,
                class_id: 1,
                title: 'Essay Quiz',
                description: null,
                time_limit: null,
                is_published: true,
                created_at: '2026-01-01T00:00:00Z',
                updated_at: '2026-01-01T00:00:00Z',
                questions: [
                    {
                        id: 104,
                        quiz_id: 10,
                        type: 'essay',
                        points: 10,
                        order: 1,
                        content: {
                            question: 'Describe the water cycle.',
                        },
                    },
                ],
            },
        });

        render(<Result submission={submission} />);
        expect(screen.getByText('This question requires manual grading.')).toBeInTheDocument();
    });

    it('shows the correct answer for a wrong multiple_choice response', () => {
        const submission = makeSubmission({
            answers: { 101: 'Berlin' },
            quiz: {
                id: 10,
                class_id: 1,
                title: 'Geography Quiz',
                description: null,
                time_limit: null,
                is_published: true,
                created_at: '2026-01-01T00:00:00Z',
                updated_at: '2026-01-01T00:00:00Z',
                questions: [
                    {
                        id: 101,
                        quiz_id: 10,
                        type: 'multiple_choice',
                        points: 5,
                        order: 1,
                        content: {
                            question: 'What is the capital of France?',
                            options: ['London', 'Berlin', 'Paris', 'Madrid'],
                            correct_answer: 'Paris',
                        },
                    },
                ],
            },
        });

        render(<Result submission={submission} />);
        // Should show the correct answer label with the value for an incorrect response
        expect(screen.getByText(/Correct answer:.*Paris/)).toBeInTheDocument();
    });
});
