<?php

namespace Tests\Feature;

use App\Models\ClassModel;
use App\Models\ExamLog;
use App\Models\Quiz;
use App\Models\Submission;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AntiCheatTest extends TestCase
{
    use RefreshDatabase;

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private function createTeacherClass(): array
    {
        $teacher = User::factory()->create(['role' => 'teacher']);
        $class = ClassModel::create([
            'user_id' => $teacher->id,
            'name' => 'Anti-Cheat Test Class',
        ]);
        return [$teacher, $class];
    }

    private function createPublishedQuiz(ClassModel $class): Quiz
    {
        return Quiz::create([
            'class_id' => $class->id,
            'title' => 'Anti-Cheat Quiz',
            'is_published' => true,
        ]);
    }

    private function createEnrolledStudent(ClassModel $class): User
    {
        $student = User::factory()->create(['role' => 'student']);
        $class->students()->attach($student->id);
        return $student;
    }

    private function createSubmission(Quiz $quiz, User $student): Submission
    {
        return Submission::create([
            'quiz_id' => $quiz->id,
            'user_id' => $student->id,
        ]);
    }

    // -------------------------------------------------------------------------
    // Student can log exam events
    // -------------------------------------------------------------------------

    public function test_student_can_log_exam_event(): void
    {
        [$teacher, $class] = $this->createTeacherClass();
        $quiz = $this->createPublishedQuiz($class);
        $student = $this->createEnrolledStudent($class);
        $submission = $this->createSubmission($quiz, $student);

        $response = $this->actingAs($student)->postJson(
            route('exam-logs.store', $submission),
            [
                'event_type' => 'tab_switch',
                'metadata' => ['count' => 1],
            ]
        );

        $response->assertOk();
        $response->assertJson(['status' => 'ok']);

        $this->assertDatabaseHas('exam_logs', [
            'submission_id' => $submission->id,
            'event_type' => 'tab_switch',
        ]);
    }

    public function test_student_can_log_multiple_event_types(): void
    {
        [$teacher, $class] = $this->createTeacherClass();
        $quiz = $this->createPublishedQuiz($class);
        $student = $this->createEnrolledStudent($class);
        $submission = $this->createSubmission($quiz, $student);

        $eventTypes = ['tab_switch', 'copy_paste', 'fullscreen_exit', 'focus_loss'];

        foreach ($eventTypes as $eventType) {
            $this->actingAs($student)->postJson(
                route('exam-logs.store', $submission),
                ['event_type' => $eventType]
            )->assertOk();
        }

        $this->assertCount(4, ExamLog::where('submission_id', $submission->id)->get());
    }

    // -------------------------------------------------------------------------
    // Non-participant cannot log exam events
    // -------------------------------------------------------------------------

    public function test_non_participant_cannot_log_exam_events(): void
    {
        [$teacher, $class] = $this->createTeacherClass();
        $quiz = $this->createPublishedQuiz($class);
        $owner = $this->createEnrolledStudent($class);
        $intruder = User::factory()->create(['role' => 'student']);

        $submission = $this->createSubmission($quiz, $owner);

        $response = $this->actingAs($intruder)->postJson(
            route('exam-logs.store', $submission),
            ['event_type' => 'tab_switch']
        );

        $response->assertForbidden();
        $this->assertDatabaseEmpty('exam_logs');
    }

    public function test_teacher_cannot_log_exam_events_for_students_submission(): void
    {
        [$teacher, $class] = $this->createTeacherClass();
        $quiz = $this->createPublishedQuiz($class);
        $student = $this->createEnrolledStudent($class);
        $submission = $this->createSubmission($quiz, $student);

        $response = $this->actingAs($teacher)->postJson(
            route('exam-logs.store', $submission),
            ['event_type' => 'tab_switch']
        );

        $response->assertForbidden();
    }

    // -------------------------------------------------------------------------
    // Logs are stored per submission
    // -------------------------------------------------------------------------

    public function test_logs_are_stored_per_submission(): void
    {
        [$teacher, $class] = $this->createTeacherClass();
        $quiz = $this->createPublishedQuiz($class);

        $studentA = $this->createEnrolledStudent($class);
        $studentB = $this->createEnrolledStudent($class);

        $submissionA = $this->createSubmission($quiz, $studentA);
        $submissionB = $this->createSubmission($quiz, $studentB);

        // Student A logs 2 events
        $this->actingAs($studentA)->postJson(
            route('exam-logs.store', $submissionA),
            ['event_type' => 'tab_switch']
        );
        $this->actingAs($studentA)->postJson(
            route('exam-logs.store', $submissionA),
            ['event_type' => 'focus_loss']
        );

        // Student B logs 1 event
        $this->actingAs($studentB)->postJson(
            route('exam-logs.store', $submissionB),
            ['event_type' => 'copy_paste']
        );

        $this->assertCount(2, ExamLog::where('submission_id', $submissionA->id)->get());
        $this->assertCount(1, ExamLog::where('submission_id', $submissionB->id)->get());
    }

    // -------------------------------------------------------------------------
    // Result page shows exam logs for the submission
    // -------------------------------------------------------------------------

    public function test_result_page_shows_exam_logs_for_submission(): void
    {
        [$teacher, $class] = $this->createTeacherClass();
        $quiz = $this->createPublishedQuiz($class);
        $student = $this->createEnrolledStudent($class);

        $submission = Submission::create([
            'quiz_id' => $quiz->id,
            'user_id' => $student->id,
            'answers' => [],
            'score' => 75,
            'earned_points' => 3,
            'total_points' => 4,
            'submitted_at' => now(),
        ]);

        ExamLog::create([
            'submission_id' => $submission->id,
            'event_type' => 'tab_switch',
            'metadata' => ['count' => 1],
        ]);

        ExamLog::create([
            'submission_id' => $submission->id,
            'event_type' => 'fullscreen_exit',
        ]);

        $response = $this->actingAs($student)->get(route('submissions.result', $submission));

        $response->assertOk();
        $response->assertInertia(function ($page) {
            $page->component('Exams/Result')
                ->has('submission')
                ->has('submission.exam_logs', 2);
        });
    }

    // -------------------------------------------------------------------------
    // Log requires event_type field
    // -------------------------------------------------------------------------

    public function test_log_requires_event_type(): void
    {
        [$teacher, $class] = $this->createTeacherClass();
        $quiz = $this->createPublishedQuiz($class);
        $student = $this->createEnrolledStudent($class);
        $submission = $this->createSubmission($quiz, $student);

        $response = $this->actingAs($student)->postJson(
            route('exam-logs.store', $submission),
            ['metadata' => ['foo' => 'bar']]
        );

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors('event_type');
    }

    public function test_log_event_type_is_limited_to_max_50_characters(): void
    {
        [$teacher, $class] = $this->createTeacherClass();
        $quiz = $this->createPublishedQuiz($class);
        $student = $this->createEnrolledStudent($class);
        $submission = $this->createSubmission($quiz, $student);

        $response = $this->actingAs($student)->postJson(
            route('exam-logs.store', $submission),
            ['event_type' => str_repeat('x', 51)]
        );

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors('event_type');
    }

    // -------------------------------------------------------------------------
    // Unauthenticated user cannot log events
    // -------------------------------------------------------------------------

    public function test_unauthenticated_user_cannot_log_exam_events(): void
    {
        [$teacher, $class] = $this->createTeacherClass();
        $quiz = $this->createPublishedQuiz($class);
        $student = $this->createEnrolledStudent($class);
        $submission = $this->createSubmission($quiz, $student);

        $response = $this->postJson(
            route('exam-logs.store', $submission),
            ['event_type' => 'tab_switch']
        );

        $response->assertUnauthorized();
    }

    // -------------------------------------------------------------------------
    // Optional metadata is stored correctly
    // -------------------------------------------------------------------------

    public function test_log_metadata_is_stored_when_provided(): void
    {
        [$teacher, $class] = $this->createTeacherClass();
        $quiz = $this->createPublishedQuiz($class);
        $student = $this->createEnrolledStudent($class);
        $submission = $this->createSubmission($quiz, $student);

        $this->actingAs($student)->postJson(
            route('exam-logs.store', $submission),
            [
                'event_type' => 'tab_switch',
                'metadata' => ['url' => 'https://google.com', 'count' => 3],
            ]
        );

        $log = ExamLog::where('submission_id', $submission->id)->first();
        $this->assertNotNull($log->metadata);
        $this->assertEquals('https://google.com', $log->metadata['url']);
        $this->assertEquals(3, $log->metadata['count']);
    }

    public function test_log_is_stored_without_metadata(): void
    {
        [$teacher, $class] = $this->createTeacherClass();
        $quiz = $this->createPublishedQuiz($class);
        $student = $this->createEnrolledStudent($class);
        $submission = $this->createSubmission($quiz, $student);

        $response = $this->actingAs($student)->postJson(
            route('exam-logs.store', $submission),
            ['event_type' => 'focus_loss']
        );

        $response->assertOk();

        $log = ExamLog::where('submission_id', $submission->id)->first();
        $this->assertNull($log->metadata);
    }
}
