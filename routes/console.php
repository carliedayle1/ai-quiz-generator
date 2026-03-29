<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Run every 5 minutes to catch quizzes that just opened or closed
Schedule::command('notifications:quiz-opened')->everyFiveMinutes();
Schedule::command('notifications:quiz-missed')->everyFiveMinutes();
