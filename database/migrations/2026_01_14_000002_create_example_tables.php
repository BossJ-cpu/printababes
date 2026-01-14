<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('customer', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->integer('age');
            $table->string('email');
            $table->timestamps();
        });
        
        Schema::create('dell', function (Blueprint $table) {
            $table->id();
            $table->string('city');
            $table->string('address');
            $table->string('username');
            $table->string('zip_code');
            $table->string('first_name');
            $table->string('last_name');
            $table->timestamps();
        });
        
        Schema::create('vans', function (Blueprint $table) {
            $table->id();
            $table->date('date_of_birth');
            $table->string('position');
            $table->date('hire_date');
            $table->decimal('salary', 10, 2);
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('customer');
        Schema::dropIfExists('dell');
        Schema::dropIfExists('vans');
    }
};
