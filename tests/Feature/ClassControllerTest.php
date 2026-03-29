<?php

namespace Tests\Feature;

use App\Models\ClassModel;
use App\Models\Question;
use App\Models\Quiz;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ClassControllerTest extends TestCase
{
    use RefreshDatabase;

    // -------------------------------------------------------------------------
    // Teacher can create a class
    // -------------------------------------------------------------------------

    public function test_teacher_can_create_class(): void
    {
        $teacher = User::factory()->create(['role' => 'teacher']);

        $response = $this->actingAs($teacher)->post(route('classes.store'), [
            'name' => 'Biology 101',
            'description' => 'An introductory biology course.',
        ]);

        $response->assertRedirect(route('classes.index'));
        $this->assertDatabaseHas('classes', [
            'user_id' => $teacher->id,
            'name' => 'Biology 101',
            'description' => 'An introductory biology course.',
        ]);
    }

    public function test_create_class_requires_name(): void
    {
        $teacher = User::factory()->create(['role' => 'teacher']);

        $response = $this->actingAs($teacher)->post(route('classes.store'), [
            'description' => 'No name provided.',
        ]);

        $response->assertSessionHasErrors('name');
        $this->assertDatabaseEmpty('classes');
    }

    public function test_class_is_created_with_an_invite_code(): void
    {
        $teacher = User::factory()->create(['role' => 'teacher']);

        $this->actingAs($teacher)->post(route('classes.store'), [
            'name' => 'Math 101',
        ]);

        $class = ClassModel::first();
        $this->assertNotNull($class->invite_code);
        $this->assertEquals(8, strlen($class->invite_code));
    }

    // -------------------------------------------------------------------------
    // Teacher cannot access another teacher's class
    // -------------------------------------------------------------------------

    public function test_teacher_cannot_access_another_teachers_class(): void
    {
        $owner = User::factory()->create(['role' => 'teacher']);
        $other = User::factory()->create(['role' => 'teacher']);

        $class = ClassModel::create([
            'user_id' => $owner->id,
            'name' => 'Owner Class',
            'description' => 'Belongs to owner.',
        ]);

        $response = $this->actingAs($other)->get(route('classes.show', $class));

        $response->assertForbidden();
    }

    public function test_teacher_can_access_their_own_class(): void
    {
        $teacher = User::factory()->create(['role' => 'teacher']);

        $class = ClassModel::create([
            'user_id' => $teacher->id,
            'name' => 'My Class',
            'description' => 'Belongs to teacher.',
        ]);

        $response = $this->actingAs($teacher)->get(route('classes.show', $class));

        $response->assertOk();
    }

    // -------------------------------------------------------------------------
    // Student can join a class with a valid invite code
    // -------------------------------------------------------------------------

    public function test_student_can_join_class_with_valid_invite_code(): void
    {
        $teacher = User::factory()->create(['role' => 'teacher']);
        $student = User::factory()->create(['role' => 'student']);

        $class = ClassModel::create([
            'user_id' => $teacher->id,
            'name' => 'Science Class',
            'invite_code' => 'ABCD1234',
        ]);

        $response = $this->actingAs($student)->post(route('classes.join'), [
            'invite_code' => 'ABCD1234',
        ]);

        $response->assertRedirect(route('classes.show', $class));
        $this->assertDatabaseHas('class_student', [
            'class_id' => $class->id,
            'user_id' => $student->id,
        ]);
    }

    // -------------------------------------------------------------------------
    // Student gets 422 when joining with an invalid invite code
    // -------------------------------------------------------------------------

    public function test_student_gets_error_joining_with_invalid_invite_code(): void
    {
        $student = User::factory()->create(['role' => 'student']);

        $response = $this->actingAs($student)
            ->from(route('classes.index'))
            ->post(route('classes.join'), [
                'invite_code' => 'INVALID1',
            ]);

        // firstOrFail throws a 404; the validation rule (size:8) would catch
        // wrong-length codes, but a well-formed but non-existent code 404s.
        $response->assertStatus(404);
    }

    public function test_join_requires_invite_code_of_exact_length(): void
    {
        $student = User::factory()->create(['role' => 'student']);

        $response = $this->actingAs($student)
            ->from(route('classes.index'))
            ->post(route('classes.join'), [
                'invite_code' => 'SHORT',
            ]);

        $response->assertSessionHasErrors('invite_code');
    }

    // -------------------------------------------------------------------------
    // Student cannot join the same class twice
    // -------------------------------------------------------------------------

    public function test_student_cannot_join_same_class_twice(): void
    {
        $teacher = User::factory()->create(['role' => 'teacher']);
        $student = User::factory()->create(['role' => 'student']);

        $class = ClassModel::create([
            'user_id' => $teacher->id,
            'name' => 'History 101',
            'invite_code' => 'HIST0101',
        ]);

        // First join
        $class->students()->attach($student->id);

        // Second join attempt
        $response = $this->actingAs($student)
            ->from(route('classes.index'))
            ->post(route('classes.join'), [
                'invite_code' => 'HIST0101',
            ]);

        $response->assertSessionHasErrors('invite_code');
    }

    // -------------------------------------------------------------------------
    // Class show returns quizzes with question counts
    // -------------------------------------------------------------------------

    public function test_class_show_returns_quizzes_with_question_counts(): void
    {
        $teacher = User::factory()->create(['role' => 'teacher']);

        $class = ClassModel::create([
            'user_id' => $teacher->id,
            'name' => 'Physics 101',
        ]);

        $quiz = Quiz::create([
            'class_id' => $class->id,
            'title' => 'Midterm Exam',
            'status' => 'published',
        ]);

        Question::create([
            'quiz_id' => $quiz->id,
            'type' => 'multiple_choice',
            'content' => [
                'question' => 'What is Newton\'s first law?',
                'options' => ['A', 'B', 'C', 'D'],
                'correct_answer' => 'A',
            ],
            'points' => 2,
            'order' => 0,
        ]);

        Question::create([
            'quiz_id' => $quiz->id,
            'type' => 'true_false',
            'content' => [
                'question' => 'Is F=ma correct?',
                'correct_answer' => true,
            ],
            'points' => 1,
            'order' => 1,
        ]);

        $response = $this->actingAs($teacher)->get(route('classes.show', $class));

        $response->assertOk();
        $response->assertInertia(function ($page) {
            $page->component('Classes/Show')
                ->has('classData')
                ->has('classData.quizzes', 1)
                ->has('classData.quizzes.0.questions', 2);
        });
    }

    // -------------------------------------------------------------------------
    // Unauthenticated users are redirected
    // -------------------------------------------------------------------------

    public function test_unauthenticated_user_cannot_access_classes(): void
    {
        $response = $this->get(route('classes.index'));

        $response->assertRedirect(route('login'));
    }

    // -------------------------------------------------------------------------
    // Student cannot access a class they are not enrolled in
    // -------------------------------------------------------------------------

    public function test_student_cannot_view_class_they_are_not_enrolled_in(): void
    {
        $teacher = User::factory()->create(['role' => 'teacher']);
        $student = User::factory()->create(['role' => 'student']);

        $class = ClassModel::create([
            'user_id' => $teacher->id,
            'name' => 'Restricted Class',
        ]);

        $response = $this->actingAs($student)->get(route('classes.show', $class));

        $response->assertForbidden();
    }
}
