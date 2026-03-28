<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('submissions', function (Blueprint $table) {
            $table->decimal('earned_points', 8, 2)->nullable()->after('score');
            $table->decimal('total_points', 8, 2)->nullable()->after('earned_points');
        });
    }

    public function down(): void
    {
        Schema::table('submissions', function (Blueprint $table) {
            $table->dropColumn(['earned_points', 'total_points']);
        });
    }
};
