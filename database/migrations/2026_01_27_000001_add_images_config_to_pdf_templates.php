<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('pdf_templates', function (Blueprint $table) {
            $table->text('images_config')->nullable()->after('fields_config'); // JSON stored as text for image e-signatures
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pdf_templates', function (Blueprint $table) {
            $table->dropColumn('images_config');
        });
    }
};
