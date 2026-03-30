<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $notification->title }} — {{ config('app.name') }}</title>
    <link rel="preconnect" href="https://fonts.bunny.net">
    <link href="https://fonts.bunny.net/css?family=figtree:400,600,700,800&display=swap" rel="stylesheet" />
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            background-color: #f5f5e8;
            font-family: 'Figtree', Arial, sans-serif;
            color: #111111;
            padding: 40px 16px;
        }
        .wrapper { max-width: 560px; margin: 0 auto; }

        .header {
            background-color: #8b31e0;
            border: 3px solid #111111;
            box-shadow: 5px 5px 0px #111111;
            padding: 24px 32px;
            display: flex;
            align-items: center;
            gap: 14px;
        }
        .brand-name {
            font-size: 28px;
            font-weight: 800;
            color: #ffe034;
            letter-spacing: -0.5px;
            line-height: 1;
        }
        .brand-tagline {
            font-size: 12px;
            font-weight: 600;
            color: rgba(255,255,255,0.75);
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-top: 4px;
        }

        .card {
            background-color: #ffffff;
            border: 3px solid #111111;
            border-top: none;
            box-shadow: 5px 5px 0px #111111;
            padding: 36px 32px;
        }

        .badge {
            display: inline-block;
            border: 2px solid #111111;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1px;
            padding: 4px 10px;
            margin-bottom: 20px;
        }
        .badge-quiz_opened  { background-color: #ffe034; }
        .badge-quiz_missed  { background-color: #fecaca; }
        .badge-quiz_shared  { background-color: #fed7aa; }
        .badge-study_tip    { background-color: #bfdbfe; }

        h1 { font-size: 24px; font-weight: 800; line-height: 1.2; margin-bottom: 14px; }
        h1 span { color: #8b31e0; }

        .body-text {
            font-size: 15px;
            color: #333333;
            line-height: 1.6;
            margin-bottom: 12px;
        }

        .info-box {
            background-color: #f5f5e8;
            border: 2px solid #111111;
            padding: 14px 18px;
            margin: 20px 0;
            font-size: 14px;
            font-weight: 600;
            color: #111111;
        }

        .btn-wrap { margin: 28px 0; }
        .btn {
            display: inline-block;
            background-color: #ffe034;
            color: #111111;
            border: 3px solid #111111;
            box-shadow: 4px 4px 0px #111111;
            font-family: 'Figtree', Arial, sans-serif;
            font-size: 15px;
            font-weight: 800;
            text-decoration: none;
            padding: 13px 28px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .divider { border: none; border-top: 2px solid #111111; margin: 24px 0; }

        .ignore-text { font-size: 13px; color: #666666; line-height: 1.5; }

        .footer { margin-top: 16px; text-align: center; padding-top: 16px; }
        .footer-text { font-size: 12px; color: #888888; font-weight: 500; }
    </style>
</head>
<body>
<div class="wrapper">

    <!-- Header -->
    <div class="header">
        <svg width="52" height="52" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" fill="none">
            <rect x="4" y="4" width="112" height="112" rx="0" fill="#8b31e0" stroke="#111111" stroke-width="6"/>
            <path d="M38 35C38 35 35 35 35 42V72C35 79 38 82 45 82H68C75 82 78 79 78 72V42C78 35 75 35 68 35H45Z" stroke="#111111" stroke-width="5" fill="#ffe034"/>
            <line x1="62" y1="68" x2="82" y2="92" stroke="#111111" stroke-width="5" stroke-linecap="square"/>
            <polygon points="88,20 78,52 90,52 76,90 106,46 92,46 104,20" fill="#ffe034" stroke="#111111" stroke-width="3" stroke-linejoin="bevel"/>
            <polyline points="42,56 50,64 65,48" stroke="#111111" stroke-width="4" stroke-linecap="square" fill="none"/>
        </svg>
        <div>
            <div class="brand-name">{{ config('app.name') }}</div>
            <div class="brand-tagline">AI-Powered Quiz Platform</div>
        </div>
    </div>

    <!-- Card -->
    <div class="card">

        @php $type = $notification->type; $data = $notification->data ?? []; @endphp

        <div class="badge badge-{{ $type }}">
            @if($type === 'quiz_opened') New Quiz
            @elseif($type === 'quiz_missed') Missed Quiz
            @elseif($type === 'quiz_shared') Quiz Shared
            @else Study Tip
            @endif
        </div>

        <h1>
            @if($type === 'quiz_opened') A New Quiz is <span>Available</span>
            @elseif($type === 'quiz_missed') You <span>Missed</span> a Quiz
            @elseif($type === 'quiz_shared') A Quiz Was <span>Shared</span> With You
            @else <span>Study Tip</span> for You
            @endif
        </h1>

        <p class="body-text">Hi {{ $recipient->first_name }},</p>
        <p class="body-text">{{ $notification->body }}</p>

        @if(!empty($data['quiz_title']))
            <div class="info-box">📋 {{ $data['quiz_title'] }}</div>
        @endif

        @if($type === 'quiz_opened' && !empty($data['route']))
            <div class="btn-wrap">
                <a href="{{ $data['route'] }}" class="btn">Take Quiz Now</a>
            </div>
        @elseif($type === 'quiz_shared' && !empty($data['route']))
            <div class="btn-wrap">
                <a href="{{ $data['route'] }}" class="btn">View in App</a>
            </div>
        @elseif($type === 'study_tip' && !empty($data['route']))
            <div class="btn-wrap">
                <a href="{{ $data['route'] }}" class="btn">Go to Quiz</a>
            </div>
        @endif

        <hr class="divider">

        <p class="ignore-text">
            This is an automated notification from {{ config('app.name') }}.
            Log in to manage your notification preferences.
        </p>
    </div>

    <div class="footer">
        <p class="footer-text">&copy; {{ date('Y') }} {{ config('app.name') }}. All rights reserved.</p>
    </div>

</div>
</body>
</html>
