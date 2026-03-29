<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('id_number', 50)->nullable()->after('id');
            $table->string('first_name', 100)->nullable()->after('id_number');
            $table->string('last_name', 100)->nullable()->after('first_name');
        });

        // Data migration: split existing name into first/last
        if (DB::getDriverName() === 'sqlite') {
            DB::statement("UPDATE users SET
                first_name = CASE WHEN INSTR(name, ' ') > 0 THEN SUBSTR(name, 1, INSTR(name, ' ') - 1) ELSE name END,
                last_name  = CASE WHEN INSTR(name, ' ') > 0 THEN SUBSTR(name, INSTR(name, ' ') + 1) ELSE name END,
                id_number  = 'USR' || printf('%06d', id)
            ");
        } else {
            DB::statement("UPDATE users SET
                first_name = IF(LOCATE(' ', name) > 0, SUBSTRING_INDEX(name, ' ', 1), name),
                last_name  = IF(LOCATE(' ', name) > 0, TRIM(SUBSTRING(name FROM LOCATE(' ', name))), name),
                id_number  = CONCAT('USR', LPAD(id, 6, '0'))
            ");
        }

        // Make columns required and add unique index on id_number
        Schema::table('users', function (Blueprint $table) {
            $table->string('first_name', 100)->nullable(false)->change();
            $table->string('last_name', 100)->nullable(false)->change();
            $table->string('id_number', 50)->nullable(false)->unique()->change();
        });

        // Drop the old name column
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('name');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('name')->nullable()->after('id');
        });

        if (DB::getDriverName() === 'sqlite') {
            DB::statement("UPDATE users SET name = first_name || ' ' || last_name");
        } else {
            DB::statement("UPDATE users SET name = CONCAT(first_name, ' ', last_name)");
        }

        Schema::table('users', function (Blueprint $table) {
            $table->string('name')->nullable(false)->change();
            $table->dropUnique(['id_number']);
            $table->dropColumn(['first_name', 'last_name', 'id_number']);
        });
    }
};
