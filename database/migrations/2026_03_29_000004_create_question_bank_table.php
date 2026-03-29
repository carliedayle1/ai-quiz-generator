<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('question_bank_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('type');
            $table->json('content');
            $table->integer('points')->default(1);
            $table->string('subject')->nullable();
            $table->string('difficulty')->default('medium');
            $table->timestamps();

            $table->index(['user_id', 'type']);
            $table->index(['user_id', 'subject']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('question_bank_items');
    }
};
