<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Adds use_as_background column for Point-to-Shoot printing feature.
     * When true: PDF template is used as the printed background with data overlaid.
     * When false: PDF template is transparent (only visible for coordinate mapping), only data fields print.
     */
    public function up(): void
    {
        Schema::table('pdf_templates', function (Blueprint $table) {
            $table->boolean('use_as_background')->default(true)->after('doctype');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pdf_templates', function (Blueprint $table) {
            $table->dropColumn('use_as_background');
        });
    }
};
