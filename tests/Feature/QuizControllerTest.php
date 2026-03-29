<?php

namespace Tests\Feature;

use App\Models\ClassModel;
use App\Models\Question;
use App\Models\Quiz;
use App\Models\User;
use App\Services\QuizGeneratorService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class QuizControllerTest extends TestCase
{
    use RefreshDatabase;

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private function makeTeacherWithClass(): array
    {
        $teacher = User::factory()->create(['role' => 'teacher']);
        $class = ClassModel::create([
            'user_id' => $teacher->id,
            'name' => 'Test Class',
            'description' => 'A test class.',
        ]);

        return [$teacher, $class];
    }

    private function sampleQuestions(): array
    {
        return [
            [
                'type' => 'multiple_choice',
                'content' => [
                    'question' => 'What is 2+2?',
                    'options' => ['3', '4', '5', '6'],
                    'correct_answer' => '4',
                ],
                'points' => 2,
            ],
            [
                'type' => 'true_false',
                'content' => [
                    'question' => 'The sky is blue.',
                    'correct_answer' => true,
                ],
                'points' => 1,
            ],
        ];
    }

    // -------------------------------------------------------------------------
    // Teacher can store a quiz with questions
    // -------------------------------------------------------------------------

    public function test_teacher_can_store_quiz_with_questions(): void
    {
        [$teacher, $class] = $this->makeTeacherWithClass();

        // Provide description so the AI service is not called
        $this->mock(QuizGeneratorService::class, function ($mock) {
            $mock->shouldNotReceive('generateDescription');
        });

        $response = $this->actingAs($teacher)->post(route('quizzes.store', $class), [
            'title' => 'Unit 1 Quiz',
            'description' => 'Covers unit 1 material.',
            'time_limit' => 30,
            'questions' => $this->sampleQuestions(),
        ]);

        $response->assertRedirect();

        $quiz = Quiz::first();
        $this->assertNotNull($quiz);
        $this->assertEquals('Unit 1 Quiz', $quiz->title);
        $this->assertEquals('Covers unit 1 material.', $quiz->description);
        $this->assertEquals(30, $quiz->time_limit);
        $this->assertCount(2, $quiz->questions);
    }

    // -------------------------------------------------------------------------
    // Auto-generates description when empty
    // -------------------------------------------------------------------------

    public function test_auto_generates_description_when_empty(): void
    {
        [$teacher, $class] = $this->makeTeacherWithClass();

        $this->mock(QuizGeneratorService::class, function ($mock) {
            $mock->shouldReceive('generateDescription')
                ->once()
                ->andReturn('An auto-generated description.');
        });

        $response = $this->actingAs($teacher)->post(route('quizzes.store', $class), [
            'title' => 'No Description Quiz',
            'description' => '',
            'questions' => $this->sampleQuestions(),
        ]);

        $response->assertRedirect();

        $quiz = Quiz::first();
        $this->assertEquals('An auto-generated description.', $quiz->description);
    }

    // -------------------------------------------------------------------------
    // Uses provided description when not empty (no AI call)
    // -------------------------------------------------------------------------

    public function test_uses_provided_description_when_not_empty(): void
    {
        [$teacher, $class] = $this->makeTeacherWithClass();

        $this->mock(QuizGeneratorService::class, function ($mock) {
            $mock->shouldNotReceive('generateDescription');
        });

        $this->actingAs($teacher)->post(route('quizzes.store', $class), [
            'title' => 'Explicit Description Quiz',
            'description' => 'I wrote this myself.',
            'questions' => $this->sampleQuestions(),
        ]);

        $quiz = Quiz::first();
        $this->assertEquals('I wrote this myself.', $quiz->description);
    }

    // -------------------------------------------------------------------------
    // Teacher can publish and unpublish a quiz
    // -------------------------------------------------------------------------

    public function test_teacher_can_publish_quiz(): void
    {
        [$teacher, $class] = $this->makeTeacherWithClass();

        $quiz = Quiz::create([
            'class_id' => $class->id,
            'title' => 'Draft Quiz',
            'status' => 'draft',
        ]);

        $response = $this->actingAs($teacher)->post(route('quizzes.publish', $quiz));

        $response->assertRedirect();
        $this->assertDatabaseHas('quizzes', [
            'id' => $quiz->id,
            'status' => 'published',
        ]);
    }

    public function test_teacher_can_unpublish_quiz(): void
    {
        [$teacher, $class] = $this->makeTeacherWithClass();

        $quiz = Quiz::create([
            'class_id' => $class->id,
            'title' => 'Published Quiz',
            'status' => 'published',
        ]);

        $response = $this->actingAs($teacher)->post(route('quizzes.unpublish', $quiz));

        $response->assertRedirect();
        $this->assertDatabaseHas('quizzes', [
            'id' => $quiz->id,
            'status' => 'draft',
        ]);
    }

    // -------------------------------------------------------------------------
    // Non-owner cannot publish
    // -------------------------------------------------------------------------

    public function test_non_owner_cannot_publish_quiz(): void
    {
        $owner = User::factory()->create(['role' => 'teacher']);
        $other = User::factory()->create(['role' => 'teacher']);

        $class = ClassModel::create([
            'user_id' => $owner->id,
            'name' => 'Owner Class',
        ]);

        $quiz = Quiz::create([
            'class_id' => $class->id,
            'title' => 'Restricted Quiz',
            'status' => 'draft',
        ]);

        $response = $this->actingAs($other)->post(route('quizzes.publish', $quiz));

        $response->assertForbidden();
        $this->assertDatabaseHas('quizzes', [
            'id' => $quiz->id,
            'status' => 'draft',
        ]);
    }

    public function test_non_owner_cannot_unpublish_quiz(): void
    {
        $owner = User::factory()->create(['role' => 'teacher']);
        $other = User::factory()->create(['role' => 'teacher']);

        $class = ClassModel::create([
            'user_id' => $owner->id,
            'name' => 'Owner Class',
        ]);

        $quiz = Quiz::create([
            'class_id' => $class->id,
            'title' => 'Published Quiz',
            'status' => 'published',
        ]);

        $response = $this->actingAs($other)->post(route('quizzes.unpublish', $quiz));

        $response->assertForbidden();
    }

    // -------------------------------------------------------------------------
    // Quiz show returns questions
    // -------------------------------------------------------------------------

    public function test_quiz_show_returns_questions(): void
    {
        [$teacher, $class] = $this->makeTeacherWithClass();

        $quiz = Quiz::create([
            'class_id' => $class->id,
            'title' => 'Show Quiz',
            'status' => 'published',
        ]);

        Question::create([
            'quiz_id' => $quiz->id,
            'type' => 'identification',
            'content' => [
                'question' => 'Name the capital of France.',
                'correct_answers' => ['Paris', 'paris'],
            ],
            'points' => 3,
            'order' => 0,
        ]);

        $response = $this->actingAs($teacher)->get(route('quizzes.show', $quiz));

        $response->assertOk();
        $response->assertInertia(function ($page) {
            $page->component('Quizzes/Show')
                ->has('quiz')
                ->has('quiz.questions', 1);
        });
    }

    // -------------------------------------------------------------------------
    // Non-owner teacher cannot view quiz show
    // -------------------------------------------------------------------------

    public function test_non_owner_teacher_cannot_view_quiz(): void
    {
        $owner = User::factory()->create(['role' => 'teacher']);
        $other = User::factory()->create(['role' => 'teacher']);

        $class = ClassModel::create([
            'user_id' => $owner->id,
            'name' => 'Owner Class',
        ]);

        $quiz = Quiz::create([
            'class_id' => $class->id,
            'title' => 'Restricted Quiz',
            'status' => 'published',
        ]);

        $response = $this->actingAs($other)->get(route('quizzes.show', $quiz));

        $response->assertForbidden();
    }

    // -------------------------------------------------------------------------
    // Store quiz validation
    // -------------------------------------------------------------------------

    public function test_store_quiz_requires_at_least_one_question(): void
    {
        [$teacher, $class] = $this->makeTeacherWithClass();

        $this->mock(QuizGeneratorService::class);

        $response = $this->actingAs($teacher)->post(route('quizzes.store', $class), [
            'title' => 'Empty Quiz',
            'questions' => [],
        ]);

        $response->assertSessionHasErrors('questions');
    }

    public function test_non_owner_cannot_store_quiz_in_another_teachers_class(): void
    {
        $owner = User::factory()->create(['role' => 'teacher']);
        $other = User::factory()->create(['role' => 'teacher']);

        $class = ClassModel::create([
            'user_id' => $owner->id,
            'name' => 'Owner Class',
        ]);

        $this->mock(QuizGeneratorService::class);

        $response = $this->actingAs($other)->post(route('quizzes.store', $class), [
            'title' => 'Hijacked Quiz',
            'questions' => $this->sampleQuestions(),
        ]);

        $response->assertForbidden();
    }
}
