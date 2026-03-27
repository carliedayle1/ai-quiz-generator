<?php

use App\Http\Controllers\ClassController;
use App\Http\Controllers\ExamLogController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\QuizController;
use App\Http\Controllers\SubmissionController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

Route::get('/dashboard', function () {
    $user = request()->user();
    if ($user->isTeacher()) {
        return redirect()->route('classes.index');
    }
    return Inertia::render('Dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    // Profile
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    // Classes
    Route::get('/classes', [ClassController::class, 'index'])->name('classes.index');
    Route::post('/classes', [ClassController::class, 'store'])->name('classes.store');
    Route::get('/classes/{class}', [ClassController::class, 'show'])->name('classes.show');
    Route::delete('/classes/{class}', [ClassController::class, 'destroy'])->name('classes.destroy');
    Route::post('/classes/join', [ClassController::class, 'join'])->name('classes.join');

    // Quizzes
    Route::get('/classes/{class}/quizzes/create', [QuizController::class, 'create'])->name('quizzes.create');
    Route::post('/classes/{class}/quizzes/generate', [QuizController::class, 'generate'])->name('quizzes.generate');
    Route::post('/classes/{class}/quizzes', [QuizController::class, 'store'])->name('quizzes.store');
    Route::get('/quizzes/{quiz}', [QuizController::class, 'show'])->name('quizzes.show');
    Route::post('/quizzes/{quiz}/publish', [QuizController::class, 'publish'])->name('quizzes.publish');
    Route::post('/quizzes/{quiz}/unpublish', [QuizController::class, 'unpublish'])->name('quizzes.unpublish');

    // Exam taking
    Route::get('/quizzes/{quiz}/take', [SubmissionController::class, 'take'])->name('quizzes.take');
    Route::post('/quizzes/{quiz}/submit', [SubmissionController::class, 'submit'])->name('quizzes.submit');
    Route::get('/submissions/{submission}/result', [SubmissionController::class, 'result'])->name('submissions.result');

    // Anti-cheat logs
    Route::post('/submissions/{submission}/logs', [ExamLogController::class, 'store'])->name('exam-logs.store');
});

require __DIR__.'/auth.php';
