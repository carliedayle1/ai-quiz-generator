<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('quiz_shares', function (Blueprint $table) {
            $table->id();
            $table->foreignId('quiz_id')->constrained()->cascadeOnDelete();
            $table->foreignId('sender_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('recipient_id')->constrained('users')->cascadeOnDelete();
            $table->string('status')->default('pending'); // pending | accepted | declined
            $table->timestamps();

            $table->index('recipient_id');
            $table->unique(['quiz_id', 'sender_id', 'recipient_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('quiz_shares');
    }
};
