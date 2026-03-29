<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use InvalidArgumentException;

class QuizGeneratorService
{
    private string $apiKey;
    private string $model;
    private string $apiUrl = 'https://api.groq.com/openai/v1/chat/completions';

    private const SYSTEM_PROMPT = <<<'PROMPT'
You are an expert educational assessment generator. Your task is to generate an exam based on the provided topic.
CRITICAL INSTRUCTION: Respond ONLY with a valid JSON array. Do not include markdown formatting, code fences, or explanations. Every object must include a 'type' key matching one of these exact strings:

1. 'multiple_choice' (Requires: question, options array, correct_answer string, points)
2. 'true_false' (Requires: question, correct_answer boolean, points)
3. 'identification' (Requires: question, correct_answers array of acceptable strings, points)
4. 'coding' (Requires: question, language, grading_rubric_keywords array, points)
5. 'essay' (Requires: question, grading_rubric string, points)
PROMPT;

    private const CONTEXT_SYSTEM_PROMPT = <<<'PROMPT'
You are an expert educational assessment generator. Your PRIMARY knowledge source is the document provided by the teacher.

DOCUMENT ANALYSIS — perform this first before generating:
- If the document IS an EXISTING EXAM, QUESTIONNAIRE, or TEST: Do NOT generate new questions. Instead, extract the existing questions exactly as written, determine the correct answers from the document context, and format them into the required JSON schema.
- If the document IS REFERENCE MATERIAL (lecture notes, textbook chapter, article, reviewer, etc.): Generate new questions based EXCLUSIVELY on the document content and the teacher's detailed instructions.

CRITICAL INSTRUCTION: Respond ONLY with a valid JSON object with a "questions" key. Do not include markdown formatting, code fences, or explanations. Every object must include a 'type' key matching one of these exact strings:

1. 'multiple_choice' (Requires: question, options array, correct_answer string, points)
2. 'true_false' (Requires: question, correct_answer boolean, points)
3. 'identification' (Requires: question, correct_answers array of acceptable strings, points)
4. 'coding' (Requires: question, language, grading_rubric_keywords array, points)
5. 'essay' (Requires: question, grading_rubric string, points)

All questions must be answerable directly from the provided document. Do not introduce outside knowledge.
PROMPT;

    private const VALID_TYPES = [
        'multiple_choice',
        'true_false',
        'identification',
        'coding',
        'essay',
    ];

    public function __construct()
    {
        $this->apiKey = config('services.groq.api_key', '');
        $this->model = config('services.groq.model', 'llama-3.3-70b-versatile');
    }

    public function generate(string $topic, int $numQuestions = 10, string $difficulty = 'medium', array $questionTypes = [], ?string $referenceText = null): array
    {
        if (empty($this->apiKey)) {
            throw new InvalidArgumentException('Groq API key is not configured. Set GROQ_API_KEY in your .env file.');
        }

        $userPrompt = $this->buildUserPrompt($topic, $numQuestions, $difficulty, $questionTypes, $referenceText);

        $maxTokens = $referenceText ? 8192 : 4096;

        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . $this->apiKey,
            'Content-Type' => 'application/json',
        ])->timeout(60)->post($this->apiUrl, [
            'model' => $this->model,
            'messages' => [
                ['role' => 'system', 'content' => self::SYSTEM_PROMPT],
                ['role' => 'user', 'content' => $userPrompt],
            ],
            'temperature' => 0.7,
            'max_tokens' => $maxTokens,
            'response_format' => ['type' => 'json_object'],
        ]);

        if (!$response->successful()) {
            Log::error('Groq API error', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);
            throw new \RuntimeException('Failed to generate quiz. API returned status: ' . $response->status() . ' - ' . $response->body());
        }

        $content = $response->json('choices.0.message.content', '');

        // Strip markdown code fences if present
        $content = preg_replace('/^```(?:json)?\s*/m', '', $content);
        $content = preg_replace('/\s*```$/m', '', $content);
        $content = trim($content);

        $decoded = json_decode($content, true);

        if (!is_array($decoded)) {
            Log::error('Groq returned non-JSON', ['content' => $content]);
            throw new \RuntimeException('AI returned invalid JSON. Please try again.');
        }

        // Groq with json_object mode may wrap in a root key like {"questions": [...]}
        $questions = $decoded;
        if (isset($decoded['questions']) && is_array($decoded['questions'])) {
            $questions = $decoded['questions'];
        }

        return $this->validateQuestions($questions);
    }

    /**
     * Context Engine mode: document is the PRIMARY source. Instructions drive all question
     * count, type, and focus decisions — no num_questions or questionTypes params needed.
     */
    public function generateFromContext(string $documentText, string $instructions): array
    {
        if (empty($this->apiKey)) {
            throw new InvalidArgumentException('Groq API key is not configured. Set GROQ_API_KEY in your .env file.');
        }

        $userPrompt = "Teacher instructions: {$instructions}";
        $userPrompt .= "\n\nEach question should have appropriate points (1-5 based on difficulty and type).";
        $userPrompt .= " Return a JSON object with a \"questions\" key containing the array.";
        $userPrompt .= "\n\n--- BEGIN DOCUMENT ---\n{$documentText}\n--- END DOCUMENT ---";

        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . $this->apiKey,
            'Content-Type' => 'application/json',
        ])->timeout(90)->post($this->apiUrl, [
            'model' => $this->model,
            'messages' => [
                ['role' => 'system', 'content' => self::CONTEXT_SYSTEM_PROMPT],
                ['role' => 'user', 'content' => $userPrompt],
            ],
            'temperature' => 0.5,
            'max_tokens' => 8192,
            'response_format' => ['type' => 'json_object'],
        ]);

        if (!$response->successful()) {
            Log::error('Groq API error (context mode)', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);
            throw new \RuntimeException('Failed to generate quiz from document. API returned status: ' . $response->status());
        }

        $content = $response->json('choices.0.message.content', '');
        $content = preg_replace('/^```(?:json)?\s*/m', '', $content);
        $content = preg_replace('/\s*```$/m', '', $content);
        $content = trim($content);

        $decoded = json_decode($content, true);

        if (!is_array($decoded)) {
            Log::error('Groq returned non-JSON (context mode)', ['content' => $content]);
            throw new \RuntimeException('AI returned invalid JSON. Please try again.');
        }

        $questions = isset($decoded['questions']) && is_array($decoded['questions'])
            ? $decoded['questions']
            : $decoded;

        return $this->validateQuestions($questions);
    }

    private function buildUserPrompt(string $topic, int $numQuestions, string $difficulty, array $questionTypes, ?string $referenceText = null): string
    {
        $prompt = "Generate exactly {$numQuestions} questions about: {$topic}. Difficulty level: {$difficulty}.";

        // Check if breakdown (type => count) or flat array
        $hasBreakdown = false;
        foreach ($questionTypes as $key => $value) {
            if (is_string($key) && is_int($value) && $value > 0) {
                $hasBreakdown = true;
                break;
            }
        }

        if ($hasBreakdown) {
            $parts = [];
            $typeLabels = [
                'multiple_choice' => 'Multiple Choice',
                'true_false' => 'True/False',
                'identification' => 'Identification',
                'coding' => 'Coding',
                'essay' => 'Essay',
            ];
            foreach ($questionTypes as $type => $count) {
                if ($count > 0) {
                    $label = $typeLabels[$type] ?? $type;
                    $parts[] = "{$count} {$label}";
                }
            }
            $prompt .= " Use this exact breakdown: " . implode(', ', $parts) . ".";
        } elseif (!empty($questionTypes)) {
            $types = implode(', ', $questionTypes);
            $prompt .= " Use only these question types: {$types}.";
        }

        $prompt .= " Each question should have appropriate points (1-5 based on difficulty and type).";
        $prompt .= " Return a JSON object with a \"questions\" key containing the array of questions.";

        if ($referenceText) {
            $prompt .= "\n\nUse the following reference material to generate questions:\n---\n{$referenceText}\n---";
        }

        return $prompt;
    }

    public function generateDescription(string $title, array $typeCounts): string
    {
        if (empty($this->apiKey)) {
            return '';
        }

        $typeLabels = [
            'multiple_choice' => 'Multiple Choice',
            'true_false' => 'True/False',
            'identification' => 'Identification',
            'coding' => 'Coding',
            'essay' => 'Essay',
        ];

        $parts = [];
        foreach ($typeCounts as $type => $count) {
            $label = $typeLabels[$type] ?? $type;
            $parts[] = "{$count} {$label}";
        }
        $breakdown = implode(', ', $parts);
        $total = array_sum($typeCounts);

        $prompt = "Generate a 1-2 sentence quiz description for a quiz titled \"{$title}\" containing {$total} questions ({$breakdown}). Keep it concise and informative for students. Return only the description text, no quotes or formatting.";

        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . $this->apiKey,
            'Content-Type' => 'application/json',
        ])->timeout(15)->post($this->apiUrl, [
            'model' => $this->model,
            'messages' => [
                ['role' => 'user', 'content' => $prompt],
            ],
            'temperature' => 0.7,
            'max_tokens' => 150,
        ]);

        if (!$response->successful()) {
            return '';
        }

        return trim($response->json('choices.0.message.content', ''));
    }

    private function validateQuestions(array $questions): array
    {
        $validated = [];

        foreach ($questions as $q) {
            if (!isset($q['type']) || !in_array($q['type'], self::VALID_TYPES)) {
                continue;
            }

            if (!isset($q['question']) || !isset($q['points'])) {
                continue;
            }

            $validated[] = $q;
        }

        if (empty($validated)) {
            throw new \RuntimeException('AI generated no valid questions. Please try again.');
        }

        return $validated;
    }
}
