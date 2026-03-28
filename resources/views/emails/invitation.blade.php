<x-mail::message>
# You've Been Invited!

You've been invited to join **{{ config('app.name') }}** as a **{{ ucfirst($invitation->role) }}**.

This invitation expires on {{ $invitation->expires_at->format('F j, Y') }}.

<x-mail::button :url="url('/register?token=' . $invitation->token)">
Accept Invitation
</x-mail::button>

If you did not expect this invitation, you can safely ignore this email.

Thanks,<br>
{{ config('app.name') }}
</x-mail::message>
