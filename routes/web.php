<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\AnalyticsController;
use App\Http\Controllers\ClassController;
use App\Http\Controllers\ExamLogController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\QuizBankController;
use App\Http\Controllers\QuizController;
use App\Http\Controllers\ShareController;
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
    if ($user->isAdmin()) {
        return redirect()->route('admin.dashboard');
    }
    if ($user->isTeacher()) {
        return redirect()->route('classes.index');
    }

    // Student dashboard data
    $enrolledClassIds = $user->enrolledClasses()->pluck('classes.id');

    $upcomingQuizzes = \App\Models\Quiz::whereIn('class_id', $enrolledClassIds)
        ->where('status', 'published')
        ->where(function ($q) {
            $q->whereNull('available_until')->orWhere('available_until', '>=', now());
        })
        ->whereDoesntHave('submissions', function ($q) use ($user) {
            $q->where('user_id', $user->id)->whereNotNull('submitted_at');
        })
        ->with('classModel:id,name')
        ->orderBy('due_date')
        ->limit(10)
        ->get();

    $recentNotifications = \App\Models\AppNotification::where('user_id', $user->id)
        ->orderByDesc('created_at')
        ->limit(5)
        ->get();

    return Inertia::render('Dashboard', [
        'upcomingQuizzes' => $upcomingQuizzes,
        'recentNotifications' => $recentNotifications,
    ]);
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    // Profile
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    // Notifications
    Route::get('/notifications', [NotificationController::class, 'index'])->name('notifications.index');
    Route::post('/notifications/{notification}/read', [NotificationController::class, 'markRead'])->name('notifications.read');
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllRead'])->name('notifications.read-all');

    // Classes, Quizzes, Exams — not accessible to admins
    Route::middleware('not_admin')->group(function () {
        // Classes
        Route::get('/classes', [ClassController::class, 'index'])->name('classes.index');
        Route::post('/classes', [ClassController::class, 'store'])->name('classes.store');
        Route::get('/classes/list-json', [ClassController::class, 'listJson'])->name('classes.list-json');
        Route::get('/classes/{class}', [ClassController::class, 'show'])->name('classes.show');
        Route::delete('/classes/{class}', [ClassController::class, 'destroy'])->name('classes.destroy');
        Route::post('/classes/join', [ClassController::class, 'join'])->name('classes.join');

        // Quizzes
        Route::get('/classes/{class}/quizzes/create', [QuizController::class, 'create'])->name('quizzes.create');
        Route::post('/classes/{class}/quizzes/generate', [QuizController::class, 'generate'])->name('quizzes.generate');
        Route::post('/classes/{class}/quizzes', [QuizController::class, 'store'])->name('quizzes.store');
        Route::get('/quizzes/{quiz}', [QuizController::class, 'show'])->name('quizzes.show');
        Route::get('/quizzes/{quiz}/edit', [QuizController::class, 'edit'])->name('quizzes.edit');
        Route::put('/quizzes/{quiz}', [QuizController::class, 'update'])->name('quizzes.update');
        Route::delete('/quizzes/{quiz}', [QuizController::class, 'destroy'])->name('quizzes.destroy');
        Route::post('/quizzes/{quiz}/publish', [QuizController::class, 'publish'])->name('quizzes.publish');
        Route::post('/quizzes/{quiz}/unpublish', [QuizController::class, 'unpublish'])->name('quizzes.unpublish');
        Route::post('/quizzes/{quiz}/schedule', [QuizController::class, 'schedule'])->name('quizzes.schedule');
        Route::get('/quizzes/{quiz}/print', [QuizController::class, 'printQuiz'])->name('quizzes.print');
        Route::post('/quizzes/{quiz}/generate-single', [QuizController::class, 'generateSingle'])->name('quizzes.generate-single');
        Route::post('/quizzes/{quiz}/clone', [QuizController::class, 'clone'])->name('quizzes.clone');
        Route::post('/quizzes/{quiz}/toggle-public', [QuizBankController::class, 'togglePublic'])->name('quizzes.toggle-public');
        Route::post('/quizzes/{quiz}/share', [ShareController::class, 'shareQuiz'])->name('quizzes.share');

        // Share actions
        Route::post('/shares/{share}/accept', [ShareController::class, 'accept'])->name('shares.accept');
        Route::post('/shares/{share}/decline', [ShareController::class, 'decline'])->name('shares.decline');

        // Global Quiz Bank
        Route::get('/quiz-bank', [QuizBankController::class, 'index'])->name('quiz-bank.index');

        // Question CRUD (order matters: reorder before {question})
        Route::post('/quizzes/{quiz}/questions/reorder', [QuizController::class, 'reorderQuestions'])->name('questions.reorder');
        Route::post('/quizzes/{quiz}/questions', [QuizController::class, 'storeQuestion'])->name('questions.store');
        Route::put('/quizzes/{quiz}/questions/{question}', [QuizController::class, 'updateQuestion'])->name('questions.update');
        Route::delete('/quizzes/{quiz}/questions/{question}', [QuizController::class, 'destroyQuestion'])->name('questions.destroy');

        // Exam taking
        Route::get('/quizzes/{quiz}/take', [SubmissionController::class, 'take'])->name('quizzes.take');
        Route::post('/quizzes/{quiz}/submit', [SubmissionController::class, 'submit'])->name('quizzes.submit');
        Route::get('/submissions/{submission}/result', [SubmissionController::class, 'result'])->name('submissions.result');
        Route::post('/submissions/{submission}/grade-question', [SubmissionController::class, 'gradeQuestion'])->name('submissions.grade-question');

        // Anti-cheat logs
        Route::post('/submissions/{submission}/logs', [ExamLogController::class, 'store'])->name('exam-logs.store');

        // Analytics (teachers only)
        Route::get('/analytics', [AnalyticsController::class, 'index'])->name('analytics.index');
        Route::get('/quizzes/{quiz}/export-gradebook', [AnalyticsController::class, 'exportGradebook'])->name('analytics.export-gradebook');

        // PDF print (submit existing result)
        Route::get('/submissions/{submission}/print', [SubmissionController::class, 'printResult'])->name('submissions.print');

    });

    // Admin routes
    Route::middleware('admin')->prefix('admin')->name('admin.')->group(function () {
        Route::get('/', [AdminController::class, 'dashboard'])->name('dashboard');
        Route::get('/users', [AdminController::class, 'users'])->name('users');
        Route::get('/invitations', [AdminController::class, 'invitations'])->name('invitations');
        Route::post('/invitations', [AdminController::class, 'sendInvitation'])->name('invitations.send');
        Route::post('/invitations/bulk', [AdminController::class, 'bulkInvite'])->name('invitations.bulk');
        Route::get('/invitations/sample', [AdminController::class, 'downloadSample'])->name('invitations.sample');
        Route::delete('/invitations/{invitation}', [AdminController::class, 'revokeInvitation'])->name('invitations.revoke');
        Route::delete('/users/{user}', [AdminController::class, 'deleteUser'])->name('users.destroy');
    });
});

require __DIR__.'/auth.php';
