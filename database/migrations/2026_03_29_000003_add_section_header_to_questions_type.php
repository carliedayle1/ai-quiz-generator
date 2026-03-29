<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // MySQL requires MODIFY to change enum; SQLite stores it as varchar, no change needed
        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE questions MODIFY type ENUM('multiple_choice','true_false','identification','coding','essay','section_header') NOT NULL");
        }
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE questions MODIFY type ENUM('multiple_choice','true_false','identification','coding','essay') NOT NULL");
        }
    }
};
