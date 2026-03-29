<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('quizzes', function (Blueprint $table) {
            // Allow cloned quizzes to exist without a class (teacher assigns later)
            $table->foreignId('class_id')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('quizzes', function (Blueprint $table) {
            $table->foreignId('class_id')->nullable(false)->change();
        });
    }
};
