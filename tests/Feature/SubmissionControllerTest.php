<?php

namespace Tests\Feature;

use App\Models\ClassModel;
use App\Models\Question;
use App\Models\Quiz;
use App\Models\Submission;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SubmissionControllerTest extends TestCase
{
    use RefreshDatabase;

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private function createEnrolledStudent(ClassModel $class): User
    {
        $student = User::factory()->create(['role' => 'student']);
        $class->students()->attach($student->id);
        return $student;
    }

    private function createPublishedQuiz(ClassModel $class, array $overrides = []): Quiz
    {
        return Quiz::create(array_merge([
            'class_id' => $class->id,
            'title' => 'Test Quiz',
            'status' => 'published',
        ], $overrides));
    }

    private function createTeacherClass(): array
    {
        $teacher = User::factory()->create(['role' => 'teacher']);
        $class = ClassModel::create([
            'user_id' => $teacher->id,
            'name' => 'Test Class',
        ]);
        return [$teacher, $class];
    }

    // -------------------------------------------------------------------------
    // Student can take a published quiz they are enrolled in
    // -------------------------------------------------------------------------

    public function test_student_can_take_published_quiz_they_are_enrolled_in(): void
    {
        [$teacher, $class] = $this->createTeacherClass();
        $quiz = $this->createPublishedQuiz($class);
        $student = $this->createEnrolledStudent($class);

        $response = $this->actingAs($student)->get(route('quizzes.take', $quiz));

        $response->assertOk();
        $response->assertInertia(function ($page) {
            $page->component('Exams/Take')
                ->has('quiz')
                ->has('submission');
        });
    }

    public function test_taking_quiz_creates_a_submission_record(): void
    {
        [$teacher, $class] = $this->createTeacherClass();
        $quiz = $this->createPublishedQuiz($class);
        $student = $this->createEnrolledStudent($class);

        $this->actingAs($student)->get(route('quizzes.take', $quiz));

        $this->assertDatabaseHas('submissions', [
            'quiz_id' => $quiz->id,
            'user_id' => $student->id,
        ]);
    }

    // -------------------------------------------------------------------------
    // Teacher cannot take exam
    // -------------------------------------------------------------------------

    public function test_teacher_cannot_take_exam(): void
    {
        [$teacher, $class] = $this->createTeacherClass();
        $quiz = $this->createPublishedQuiz($class);

        $response = $this->actingAs($teacher)->get(route('quizzes.take', $quiz));

        $response->assertForbidden();
    }

    // -------------------------------------------------------------------------
    // Student cannot take an unpublished quiz
    // -------------------------------------------------------------------------

    public function test_student_cannot_take_unpublished_quiz(): void
    {
        [$teacher, $class] = $this->createTeacherClass();
        $quiz = $this->createPublishedQuiz($class, ['status' => 'draft']);
        $student = $this->createEnrolledStudent($class);

        $response = $this->actingAs($student)->get(route('quizzes.take', $quiz));

        $response->assertNotFound();
    }

    // -------------------------------------------------------------------------
    // Student not enrolled cannot take quiz
    // -------------------------------------------------------------------------

    public function test_unenrolled_student_cannot_take_quiz(): void
    {
        [$teacher, $class] = $this->createTeacherClass();
        $quiz = $this->createPublishedQuiz($class);
        $student = User::factory()->create(['role' => 'student']);

        $response = $this->actingAs($student)->get(route('quizzes.take', $quiz));

        $response->assertForbidden();
    }

    // -------------------------------------------------------------------------
    // Student submitting returns redirect to result
    // -------------------------------------------------------------------------

    public function test_student_submitting_redirects_to_result(): void
    {
        [$teacher, $class] = $this->createTeacherClass();
        $quiz = $this->createPublishedQuiz($class);
        $student = $this->createEnrolledStudent($class);

        $question = Question::create([
            'quiz_id' => $quiz->id,
            'type' => 'multiple_choice',
            'content' => [
                'question' => 'What is 1+1?',
                'options' => ['1', '2', '3', '4'],
                'correct_answer' => '2',
            ],
            'points' => 1,
            'order' => 0,
        ]);

        $submission = Submission::create([
            'quiz_id' => $quiz->id,
            'user_id' => $student->id,
        ]);

        $response = $this->actingAs($student)->post(route('quizzes.submit', $quiz), [
            'answers' => [$question->id => '2'],
        ]);

        $response->assertRedirect(route('submissions.result', $submission));
    }

    // -------------------------------------------------------------------------
    // Score is calculated correctly
    // -------------------------------------------------------------------------

    public function test_multiple_choice_exact_match_awards_points(): void
    {
        [$teacher, $class] = $this->createTeacherClass();
        $quiz = $this->createPublishedQuiz($class);
        $student = $this->createEnrolledStudent($class);

        $question = Question::create([
            'quiz_id' => $quiz->id,
            'type' => 'multiple_choice',
            'content' => [
                'question' => 'Best programming language?',
                'options' => ['PHP', 'Java', 'Python', 'Ruby'],
                'correct_answer' => 'PHP',
            ],
            'points' => 5,
            'order' => 0,
        ]);

        Submission::create(['quiz_id' => $quiz->id, 'user_id' => $student->id]);

        $this->actingAs($student)->post(route('quizzes.submit', $quiz), [
            'answers' => [$question->id => 'PHP'],
        ]);

        $submission = Submission::where('quiz_id', $quiz->id)->where('user_id', $student->id)->first();
        $this->assertEquals(5, (float) $submission->earned_points);
        $this->assertEquals(5, (float) $submission->total_points);
        $this->assertEquals(100.00, (float) $submission->score);
    }

    public function test_multiple_choice_wrong_answer_awards_no_points(): void
    {
        [$teacher, $class] = $this->createTeacherClass();
        $quiz = $this->createPublishedQuiz($class);
        $student = $this->createEnrolledStudent($class);

        $question = Question::create([
            'quiz_id' => $quiz->id,
            'type' => 'multiple_choice',
            'content' => [
                'question' => 'Best programming language?',
                'options' => ['PHP', 'Java', 'Python', 'Ruby'],
                'correct_answer' => 'PHP',
            ],
            'points' => 5,
            'order' => 0,
        ]);

        Submission::create(['quiz_id' => $quiz->id, 'user_id' => $student->id]);

        $this->actingAs($student)->post(route('quizzes.submit', $quiz), [
            'answers' => [$question->id => 'Java'],
        ]);

        $submission = Submission::where('quiz_id', $quiz->id)->where('user_id', $student->id)->first();
        $this->assertEquals(0, (float) $submission->earned_points);
        $this->assertEquals(0.00, (float) $submission->score);
    }

    public function test_true_false_boolean_match_awards_points(): void
    {
        [$teacher, $class] = $this->createTeacherClass();
        $quiz = $this->createPublishedQuiz($class);
        $student = $this->createEnrolledStudent($class);

        $question = Question::create([
            'quiz_id' => $quiz->id,
            'type' => 'true_false',
            'content' => [
                'question' => 'The earth is round.',
                'correct_answer' => true,
            ],
            'points' => 2,
            'order' => 0,
        ]);

        Submission::create(['quiz_id' => $quiz->id, 'user_id' => $student->id]);

        $this->actingAs($student)->post(route('quizzes.submit', $quiz), [
            'answers' => [$question->id => 'true'],
        ]);

        $submission = Submission::where('quiz_id', $quiz->id)->where('user_id', $student->id)->first();
        $this->assertEquals(2, (float) $submission->earned_points);
        $this->assertEquals(100.00, (float) $submission->score);
    }

    public function test_true_false_wrong_boolean_awards_no_points(): void
    {
        [$teacher, $class] = $this->createTeacherClass();
        $quiz = $this->createPublishedQuiz($class);
        $student = $this->createEnrolledStudent($class);

        $question = Question::create([
            'quiz_id' => $quiz->id,
            'type' => 'true_false',
            'content' => [
                'question' => 'The earth is flat.',
                'correct_answer' => false,
            ],
            'points' => 2,
            'order' => 0,
        ]);

        Submission::create(['quiz_id' => $quiz->id, 'user_id' => $student->id]);

        $this->actingAs($student)->post(route('quizzes.submit', $quiz), [
            'answers' => [$question->id => 'true'],
        ]);

        $submission = Submission::where('quiz_id', $quiz->id)->where('user_id', $student->id)->first();
        $this->assertEquals(0, (float) $submission->earned_points);
    }

    public function test_identification_case_insensitive_match_awards_points(): void
    {
        [$teacher, $class] = $this->createTeacherClass();
        $quiz = $this->createPublishedQuiz($class);
        $student = $this->createEnrolledStudent($class);

        $question = Question::create([
            'quiz_id' => $quiz->id,
            'type' => 'identification',
            'content' => [
                'question' => 'What is the capital of France?',
                'correct_answers' => ['Paris', 'paris'],
            ],
            'points' => 3,
            'order' => 0,
        ]);

        Submission::create(['quiz_id' => $quiz->id, 'user_id' => $student->id]);

        $this->actingAs($student)->post(route('quizzes.submit', $quiz), [
            'answers' => [$question->id => 'PARIS'],
        ]);

        $submission = Submission::where('quiz_id', $quiz->id)->where('user_id', $student->id)->first();
        $this->assertEquals(3, (float) $submission->earned_points);
        $this->assertEquals(100.00, (float) $submission->score);
    }

    public function test_coding_question_awards_zero_points(): void
    {
        [$teacher, $class] = $this->createTeacherClass();
        $quiz = $this->createPublishedQuiz($class);
        $student = $this->createEnrolledStudent($class);

        $question = Question::create([
            'quiz_id' => $quiz->id,
            'type' => 'coding',
            'content' => [
                'question' => 'Write a function to reverse a string.',
                'language' => 'php',
                'grading_rubric_keywords' => ['strrev', 'reverse'],
            ],
            'points' => 10,
            'order' => 0,
        ]);

        Submission::create(['quiz_id' => $quiz->id, 'user_id' => $student->id]);

        $this->actingAs($student)->post(route('quizzes.submit', $quiz), [
            'answers' => [$question->id => 'function reverse($s) { return strrev($s); }'],
        ]);

        $submission = Submission::where('quiz_id', $quiz->id)->where('user_id', $student->id)->first();
        $this->assertEquals(0, (float) $submission->earned_points);
        $this->assertEquals(10, (float) $submission->total_points);
        $this->assertEquals(0.00, (float) $submission->score);
    }

    public function test_essay_question_awards_zero_points(): void
    {
        [$teacher, $class] = $this->createTeacherClass();
        $quiz = $this->createPublishedQuiz($class);
        $student = $this->createEnrolledStudent($class);

        $question = Question::create([
            'quiz_id' => $quiz->id,
            'type' => 'essay',
            'content' => [
                'question' => 'Discuss the causes of World War I.',
                'grading_rubric' => 'Mention at least three causes.',
            ],
            'points' => 10,
            'order' => 0,
        ]);

        Submission::create(['quiz_id' => $quiz->id, 'user_id' => $student->id]);

        $this->actingAs($student)->post(route('quizzes.submit', $quiz), [
            'answers' => [$question->id => 'Nationalism, imperialism, and assassination of Franz Ferdinand.'],
        ]);

        $submission = Submission::where('quiz_id', $quiz->id)->where('user_id', $student->id)->first();
        $this->assertEquals(0, (float) $submission->earned_points);
    }

    // -------------------------------------------------------------------------
    // earned_points and total_points stored correctly with mixed questions
    // -------------------------------------------------------------------------

    public function test_earned_and_total_points_stored_correctly_with_mixed_questions(): void
    {
        [$teacher, $class] = $this->createTeacherClass();
        $quiz = $this->createPublishedQuiz($class);
        $student = $this->createEnrolledStudent($class);

        $q1 = Question::create([
            'quiz_id' => $quiz->id,
            'type' => 'multiple_choice',
            'content' => ['question' => 'Q1', 'options' => ['A', 'B'], 'correct_answer' => 'A'],
            'points' => 4,
            'order' => 0,
        ]);

        $q2 = Question::create([
            'quiz_id' => $quiz->id,
            'type' => 'identification',
            'content' => ['question' => 'Q2', 'correct_answers' => ['water']],
            'points' => 3,
            'order' => 1,
        ]);

        $q3 = Question::create([
            'quiz_id' => $quiz->id,
            'type' => 'essay',
            'content' => ['question' => 'Q3', 'grading_rubric' => 'anything'],
            'points' => 5,
            'order' => 2,
        ]);

        Submission::create(['quiz_id' => $quiz->id, 'user_id' => $student->id]);

        // q1 correct (+4), q2 correct (+3), q3 essay (0)
        $this->actingAs($student)->post(route('quizzes.submit', $quiz), [
            'answers' => [
                $q1->id => 'A',
                $q2->id => 'water',
                $q3->id => 'some essay answer',
            ],
        ]);

        $submission = Submission::where('quiz_id', $quiz->id)->where('user_id', $student->id)->first();
        $this->assertEquals(7, (float) $submission->earned_points);
        $this->assertEquals(12, (float) $submission->total_points);
        // 7/12 * 100 = 58.33
        $this->assertEquals(58.33, (float) $submission->score);
    }

    // -------------------------------------------------------------------------
    // Resubmitting redirects to existing result
    // -------------------------------------------------------------------------

    public function test_resubmitting_redirects_to_existing_result(): void
    {
        [$teacher, $class] = $this->createTeacherClass();
        $quiz = $this->createPublishedQuiz($class);
        $student = $this->createEnrolledStudent($class);

        $existing = Submission::create([
            'quiz_id' => $quiz->id,
            'user_id' => $student->id,
            'answers' => [],
            'score' => 100,
            'earned_points' => 5,
            'total_points' => 5,
            'submitted_at' => now(),
        ]);

        $response = $this->actingAs($student)->get(route('quizzes.take', $quiz));

        $response->assertRedirect(route('submissions.result', $existing));
    }

    // -------------------------------------------------------------------------
    // Result page is accessible
    // -------------------------------------------------------------------------

    public function test_student_can_view_their_own_result(): void
    {
        [$teacher, $class] = $this->createTeacherClass();
        $quiz = $this->createPublishedQuiz($class);
        $student = $this->createEnrolledStudent($class);

        $submission = Submission::create([
            'quiz_id' => $quiz->id,
            'user_id' => $student->id,
            'answers' => [],
            'score' => 80,
            'earned_points' => 8,
            'total_points' => 10,
            'submitted_at' => now(),
        ]);

        $response = $this->actingAs($student)->get(route('submissions.result', $submission));

        $response->assertOk();
        $response->assertInertia(function ($page) {
            $page->component('Exams/Result')
                ->has('submission');
        });
    }

    public function test_student_cannot_view_another_students_result(): void
    {
        [$teacher, $class] = $this->createTeacherClass();
        $quiz = $this->createPublishedQuiz($class);
        $owner = $this->createEnrolledStudent($class);
        $other = $this->createEnrolledStudent($class);

        $submission = Submission::create([
            'quiz_id' => $quiz->id,
            'user_id' => $owner->id,
            'answers' => [],
            'submitted_at' => now(),
        ]);

        $response = $this->actingAs($other)->get(route('submissions.result', $submission));

        $response->assertForbidden();
    }

    public function test_teacher_can_view_student_result_from_their_quiz(): void
    {
        [$teacher, $class] = $this->createTeacherClass();
        $quiz = $this->createPublishedQuiz($class);
        $student = $this->createEnrolledStudent($class);

        $submission = Submission::create([
            'quiz_id' => $quiz->id,
            'user_id' => $student->id,
            'answers' => [],
            'submitted_at' => now(),
        ]);

        $response = $this->actingAs($teacher)->get(route('submissions.result', $submission));

        $response->assertOk();
    }
}
