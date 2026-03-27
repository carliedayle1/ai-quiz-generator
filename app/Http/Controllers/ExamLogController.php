<?php

namespace App\Http\Controllers;

use App\Models\Submission;
use Illuminate\Http\Request;

class ExamLogController extends Controller
{
    public function store(Submission $submission, Request $request)
    {
        if ($submission->user_id !== $request->user()->id) {
            abort(403);
        }

        $validated = $request->validate([
            'event_type' => 'required|string|max:50',
            'metadata' => 'nullable|array',
        ]);

        $submission->examLogs()->create($validated);

        return response()->json(['status' => 'ok']);
    }
}
