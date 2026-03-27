<?php

namespace App\Http\Controllers;

use App\Models\ClassModel;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ClassController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        if ($user->isTeacher()) {
            $classes = $user->ownedClasses()->withCount('students', 'quizzes')->latest()->get();
        } else {
            $classes = $user->enrolledClasses()->withCount('quizzes')->latest()->get();
        }

        return Inertia::render('Classes/Index', [
            'classes' => $classes,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
        ]);

        $request->user()->ownedClasses()->create($validated);

        return redirect()->route('classes.index');
    }

    public function show(ClassModel $class)
    {
        $user = request()->user();

        if ($user->isTeacher() && $class->user_id !== $user->id) {
            abort(403);
        }

        if ($user->isStudent() && !$class->students()->where('user_id', $user->id)->exists()) {
            abort(403);
        }

        $class->load(['quizzes', 'students', 'teacher']);

        return Inertia::render('Classes/Show', [
            'classData' => $class,
        ]);
    }

    public function destroy(ClassModel $class, Request $request)
    {
        if ($class->user_id !== $request->user()->id) {
            abort(403);
        }

        $class->delete();

        return redirect()->route('classes.index');
    }

    public function join(Request $request)
    {
        $validated = $request->validate([
            'invite_code' => 'required|string|size:8',
        ]);

        $class = ClassModel::where('invite_code', $validated['invite_code'])->firstOrFail();

        $user = $request->user();

        if ($class->students()->where('user_id', $user->id)->exists()) {
            return back()->withErrors(['invite_code' => 'You are already in this class.']);
        }

        $class->students()->attach($user->id);

        return redirect()->route('classes.show', $class);
    }
}
