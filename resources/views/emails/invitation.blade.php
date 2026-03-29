<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>You've Been Invited — {{ config('app.name') }}</title>
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
        .wrapper {
            max-width: 560px;
            margin: 0 auto;
        }

        /* Header */
        .header {
            background-color: #8b31e0;
            border: 3px solid #111111;
            box-shadow: 5px 5px 0px #111111;
            padding: 24px 32px;
            display: flex;
            align-items: center;
            gap: 14px;
            margin-bottom: 0;
        }
        .logo-wrap {
            flex-shrink: 0;
        }
        .logo-wrap svg {
            display: block;
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

        /* Body card */
        .card {
            background-color: #ffffff;
            border: 3px solid #111111;
            border-top: none;
            box-shadow: 5px 5px 0px #111111;
            padding: 36px 32px;
        }

        .badge {
            display: inline-block;
            background-color: #ffe034;
            border: 2px solid #111111;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1px;
            padding: 4px 10px;
            margin-bottom: 20px;
        }

        h1 {
            font-size: 26px;
            font-weight: 800;
            color: #111111;
            line-height: 1.2;
            margin-bottom: 16px;
        }
        h1 span {
            color: #8b31e0;
        }

        .body-text {
            font-size: 15px;
            font-weight: 400;
            color: #333333;
            line-height: 1.6;
            margin-bottom: 12px;
        }

        /* Role pill */
        .role-pill {
            display: inline-block;
            background-color: #8b31e0;
            color: #ffffff;
            border: 2px solid #111111;
            font-size: 13px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            padding: 4px 12px;
        }

        /* Expiry notice */
        .expiry {
            display: flex;
            align-items: center;
            gap: 8px;
            background-color: #fff8e1;
            border: 2px solid #111111;
            padding: 12px 16px;
            margin: 24px 0;
            font-size: 13px;
            font-weight: 600;
            color: #111111;
        }
        .expiry-icon {
            font-size: 16px;
            flex-shrink: 0;
        }

        /* CTA button */
        .btn-wrap {
            margin: 28px 0;
        }
        .btn {
            display: inline-block;
            background-color: #ffe034;
            color: #111111;
            border: 3px solid #111111;
            box-shadow: 4px 4px 0px #111111;
            font-family: 'Figtree', Arial, sans-serif;
            font-size: 16px;
            font-weight: 800;
            text-decoration: none;
            padding: 14px 32px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .divider {
            border: none;
            border-top: 2px solid #111111;
            margin: 28px 0;
        }

        .ignore-text {
            font-size: 13px;
            color: #666666;
            line-height: 1.5;
        }

        /* Footer */
        .footer {
            margin-top: 16px;
            text-align: center;
            padding: 16px 0 0;
        }
        .footer-text {
            font-size: 12px;
            color: #888888;
            font-weight: 500;
        }
        .footer-text a {
            color: #8b31e0;
            text-decoration: none;
            font-weight: 700;
        }

        /* Fallback link block */
        .link-fallback {
            background-color: #f5f5e8;
            border: 2px solid #cccccc;
            padding: 10px 14px;
            margin-top: 16px;
            word-break: break-all;
            font-size: 12px;
            color: #555555;
        }
    </style>
</head>
<body>
    <div class="wrapper">

        <!-- Header -->
        <div class="header">
            <div class="logo-wrap">
                <!-- QuizAI Logo (inline SVG) -->
                <svg width="52" height="52" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" fill="none">
                    <rect x="4" y="4" width="112" height="112" rx="0" fill="#8b31e0" stroke="#111111" stroke-width="6"/>
                    <path d="M38 35C38 35 35 35 35 42V72C35 79 38 82 45 82H68C75 82 78 79 78 72V42C78 35 75 35 68 35H45Z" stroke="#111111" stroke-width="5" fill="#ffe034"/>
                    <line x1="62" y1="68" x2="82" y2="92" stroke="#111111" stroke-width="5" stroke-linecap="square"/>
                    <polygon points="88,20 78,52 90,52 76,90 106,46 92,46 104,20" fill="#ffe034" stroke="#111111" stroke-width="3" stroke-linejoin="bevel"/>
                    <polyline points="42,56 50,64 65,48" stroke="#111111" stroke-width="4" stroke-linecap="square" fill="none"/>
                </svg>
            </div>
            <div>
                <div class="brand-name">{{ config('app.name') }}</div>
                <div class="brand-tagline">AI-Powered Quiz Platform</div>
            </div>
        </div>

        <!-- Card Body -->
        <div class="card">
            <div class="badge">Invitation</div>

            <h1>You've Been <span>Invited!</span></h1>

            <p class="body-text">
                You've been invited to join <strong>{{ config('app.name') }}</strong> as a
                <span class="role-pill">{{ ucfirst($invitation->role) }}</span>
            </p>

            <p class="body-text" style="margin-top: 16px;">
                Click the button below to accept your invitation and set up your account.
            </p>

            <!-- Expiry Notice -->
            <div class="expiry">
                <span class="expiry-icon">⏳</span>
                <span>This invitation expires on <strong>{{ $invitation->expires_at->format('F j, Y') }}</strong></span>
            </div>

            <!-- CTA -->
            <div class="btn-wrap">
                <a href="{{ url('/register?token=' . $invitation->token) }}" class="btn">
                    Accept Invitation
                </a>
            </div>

            <hr class="divider">

            <p class="ignore-text">
                If you did not expect this invitation or believe it was sent in error, you can safely ignore this email. No account will be created without your action.
            </p>

            <div class="link-fallback">
                If the button above doesn't work, copy and paste this link into your browser:<br>
                <span style="color: #8b31e0;">{{ url('/register?token=' . $invitation->token) }}</span>
            </div>
        </div>

        <!-- Footer -->
        <div class="footer">
            <p class="footer-text">
                &copy; {{ date('Y') }} {{ config('app.name') }}. All rights reserved.
            </p>
        </div>

    </div>
</body>
</html>
