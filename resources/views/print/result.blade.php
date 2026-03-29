<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $quiz->title }} — Result</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Courier New', monospace; font-size: 12px; color: #000; background: #fff; padding: 24px; }
        h1 { font-size: 20px; font-weight: bold; border-bottom: 3px solid #000; padding-bottom: 8px; margin-bottom: 16px; }
        h2 { font-size: 14px; font-weight: bold; margin-bottom: 4px; }
        .meta { display: flex; gap: 24px; margin-bottom: 20px; font-size: 11px; }
        .meta span { border: 2px solid #000; padding: 2px 8px; }
        .score-box { border: 3px solid #000; padding: 8px 16px; display: inline-block; font-size: 24px; font-weight: bold; margin-bottom: 20px; }
        .question { border: 2px solid #000; padding: 12px; margin-bottom: 12px; page-break-inside: avoid; }
        .question-header { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; font-size: 11px; }
        .badge { border: 1.5px solid #000; padding: 1px 6px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; }
        .question-text { font-weight: bold; margin-bottom: 8px; }
        .answer { font-size: 11px; }
        .answer .label { font-weight: bold; }
        .correct { color: #166534; }
        .wrong { color: #991b1b; }
        .flag-section { border: 3px solid #991b1b; padding: 12px; margin-bottom: 20px; }
        .flag-section h3 { font-size: 13px; font-weight: bold; color: #991b1b; margin-bottom: 8px; }
        .flag-row { display: flex; justify-content: space-between; font-size: 11px; border-bottom: 1px solid #ddd; padding: 3px 0; }
        @media print {
            body { padding: 0; }
            @page { margin: 15mm; }
        }
    </style>
</head>
<body>
    <h1>{{ $quiz->title }}</h1>

    <div class="meta">
        <span>Student: {{ $submission->student?->first_name }} {{ $submission->student?->last_name }}</span>
        <span>ID: {{ $submission->student?->id_number ?? '—' }}</span>
        <span>Submitted: {{ $submission->submitted_at?->format('M d, Y H:i') ?? '—' }}</span>
    </div>

    <div>
        <div class="score-box">
            @if($submission->earned_points !== null)
                {{ $submission->earned_points }}/{{ $submission->total_points }} pts
                &nbsp;({{ $submission->score }}%)
            @else
                Pending
            @endif
        </div>
    </div>

    {{-- Anti-cheat flags --}}
    @if($submission->examLogs && $submission->examLogs->count() > 0)
        <div class="flag-section">
            <h3>⚠ Anti-Cheat Events ({{ $submission->examLogs->count() }})</h3>
            @foreach($submission->examLogs as $log)
                <div class="flag-row">
                    <span>{{ str_replace('_', ' ', $log->event_type) }}</span>
                    <span>{{ \Carbon\Carbon::parse($log->created_at)->format('H:i:s') }}</span>
                </div>
            @endforeach
        </div>
    @endif

    {{-- Questions --}}
    @php
        $answers = $submission->answers ?? [];
        $manualGrades = $submission->manual_grades ?? [];
        $qNum = 0;
    @endphp

    @foreach($quiz->questions as $question)
        @if($question->type === 'section_header')
            <h2 style="margin: 16px 0 8px; border-top: 2px solid #000; padding-top: 8px;">
                {{ $question->content['title'] ?? 'Section' }}
            </h2>
            @continue
        @endif

        @php
            $qNum++;
            $answer = $answers[$question->id] ?? null;
            $isCorrect = null;
            $content = $question->content;

            if ($question->type === 'multiple_choice') {
                $isCorrect = $answer === ($content['correct_answer'] ?? null);
            } elseif ($question->type === 'true_false') {
                $isCorrect = (string)($content['correct_answer'] ?? '') === (string)$answer;
            } elseif ($question->type === 'identification') {
                $acceptable = array_map('strtolower', array_map('trim', $content['correct_answers'] ?? []));
                $isCorrect = in_array(strtolower(trim($answer ?? '')), $acceptable);
            }

            $needsManual = in_array($question->type, ['essay', 'coding']);
            $awarded = $manualGrades[$question->id] ?? null;
        @endphp

        <div class="question">
            <div class="question-header">
                <span>Q{{ $qNum }}</span>
                <span class="badge">{{ str_replace('_', ' ', $question->type) }}</span>
                <span>{{ $question->points }} pts</span>
                @if($needsManual && $awarded !== null)
                    <span class="correct">Awarded: {{ $awarded }}</span>
                @elseif($isCorrect === true)
                    <span class="correct">✓ Correct</span>
                @elseif($isCorrect === false)
                    <span class="wrong">✗ Incorrect</span>
                @endif
            </div>

            <p class="question-text">{{ $content['question'] ?? '' }}</p>

            <div class="answer">
                <p><span class="label">Answer:</span> {{ $answer ?? '(no answer)' }}</p>

                @if($isCorrect === false && !$needsManual)
                    <p class="correct">
                        <span class="label">Correct:</span>
                        {{ $question->type === 'multiple_choice'
                            ? ($content['correct_answer'] ?? '')
                            : ($question->type === 'true_false'
                                ? ($content['correct_answer'] ? 'True' : 'False')
                                : implode(', ', $content['correct_answers'] ?? []))
                        }}
                    </p>
                @endif

                @if($needsManual && $awarded === null)
                    <p style="font-style: italic; color: #555;">Awaiting manual grading.</p>
                @endif
            </div>
        </div>
    @endforeach

    <p style="margin-top: 24px; font-size: 10px; color: #666; border-top: 1px solid #ccc; padding-top: 8px;">
        Printed from QuizAI — {{ now()->format('M d, Y H:i') }}
    </p>

    <script>window.onload = () => window.print();</script>
</body>
</html>
