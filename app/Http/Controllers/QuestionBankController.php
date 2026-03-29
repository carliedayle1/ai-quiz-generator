<?php

namespace App\Http\Controllers;

use App\Models\QuestionBankItem;
use Illuminate\Http\Request;
use Inertia\Inertia;

class QuestionBankController extends Controller
{
    public function index(Request $request)
    {
        $query = QuestionBankItem::where('user_id', $request->user()->id)
            ->orderByDesc('created_at');

        if ($request->filled('type')) {
            $query->where('type', $request->input('type'));
        }

        if ($request->filled('subject')) {
            $query->where('subject', $request->input('subject'));
        }

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->whereRaw("LOWER(JSON_EXTRACT(content, '$.question')) LIKE ?", ['%' . strtolower($search) . '%'])
                  ->orWhere('subject', 'like', '%' . $search . '%');
            });
        }

        $items = $query->paginate(20)->withQueryString();

        $subjects = QuestionBankItem::where('user_id', $request->user()->id)
            ->whereNotNull('subject')
            ->distinct()
            ->pluck('subject');

        return Inertia::render('QuestionBank/Index', [
            'items' => $items,
            'subjects' => $subjects,
            'filters' => $request->only(['type', 'subject', 'search']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'type' => 'required|in:multiple_choice,true_false,identification,coding,essay',
            'content' => 'required|array',
            'points' => 'required|integer|min:1|max:100',
            'subject' => 'nullable|string|max:100',
            'difficulty' => 'required|in:easy,medium,hard',
        ]);

        $item = QuestionBankItem::create([
            ...$validated,
            'user_id' => $request->user()->id,
        ]);

        return response()->json(['item' => $item]);
    }

    public function update(Request $request, QuestionBankItem $questionBankItem)
    {
        if ($questionBankItem->user_id !== $request->user()->id) {
            abort(403);
        }

        $validated = $request->validate([
            'content' => 'sometimes|array',
            'points' => 'sometimes|integer|min:1|max:100',
            'subject' => 'nullable|string|max:100',
            'difficulty' => 'sometimes|in:easy,medium,hard',
        ]);

        $questionBankItem->update($validated);

        return response()->json(['item' => $questionBankItem->fresh()]);
    }

    public function destroy(Request $request, QuestionBankItem $questionBankItem)
    {
        if ($questionBankItem->user_id !== $request->user()->id) {
            abort(403);
        }

        $questionBankItem->delete();

        return response()->json(['ok' => true]);
    }

    /**
     * Save questions from a generated quiz into the bank.
     */
    public function bulkStore(Request $request)
    {
        $validated = $request->validate([
            'items' => 'required|array|min:1',
            'items.*.type' => 'required|in:multiple_choice,true_false,identification,coding,essay',
            'items.*.content' => 'required|array',
            'items.*.points' => 'required|integer|min:1|max:100',
            'items.*.subject' => 'nullable|string|max:100',
            'items.*.difficulty' => 'nullable|in:easy,medium,hard',
        ]);

        $userId = $request->user()->id;

        $created = collect($validated['items'])->map(function ($item) use ($userId) {
            return QuestionBankItem::create([
                'user_id' => $userId,
                'type' => $item['type'],
                'content' => $item['content'],
                'points' => $item['points'],
                'subject' => $item['subject'] ?? null,
                'difficulty' => $item['difficulty'] ?? 'medium',
            ]);
        });

        return response()->json(['count' => $created->count()]);
    }

    /**
     * Return items as JSON for the picker (used in Edit.tsx).
     */
    public function search(Request $request)
    {
        $query = QuestionBankItem::where('user_id', $request->user()->id)
            ->orderByDesc('created_at')
            ->limit(50);

        if ($request->filled('type')) {
            $query->where('type', $request->input('type'));
        }

        if ($request->filled('q')) {
            $search = $request->input('q');
            $query->where(function ($q) use ($search) {
                $q->whereRaw("LOWER(JSON_EXTRACT(content, '$.question')) LIKE ?", ['%' . strtolower($search) . '%'])
                  ->orWhere('subject', 'like', '%' . $search . '%');
            });
        }

        return response()->json(['items' => $query->get()]);
    }
}
