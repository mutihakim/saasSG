<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Base migration now creates attachable_id as string(100).
    }

    public function down(): void
    {
        // No-op.
    }
};
