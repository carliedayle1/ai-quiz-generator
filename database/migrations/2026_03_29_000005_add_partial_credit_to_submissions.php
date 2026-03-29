<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('submissions', function (Blueprint $table) {
            $table->json('manual_grades')->nullable()->after('answers');
        });

        Schema::table('quizzes', function (Blueprint $table) {
            $table->boolean('allow_partial_credit')->default(false)->after('time_limit');
        });
    }

    public function down(): void
    {
        Schema::table('submissions', function (Blueprint $table) {
            $table->dropColumn('manual_grades');
        });

        Schema::table('quizzes', function (Blueprint $table) {
            $table->dropColumn('allow_partial_credit');
        });
    }
};
