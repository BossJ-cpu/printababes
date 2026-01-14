<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

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

        // Seed customer table
        $customers = [
            ['name' => 'John Doe', 'age' => 28, 'email' => 'john.doe@example.com'],
            ['name' => 'Jane Smith', 'age' => 34, 'email' => 'jane.smith@example.com'],
            ['name' => 'Michael Johnson', 'age' => 42, 'email' => 'michael.j@example.com'],
            ['name' => 'Emily Davis', 'age' => 25, 'email' => 'emily.davis@example.com'],
            ['name' => 'Robert Brown', 'age' => 31, 'email' => 'robert.brown@example.com'],
            ['name' => 'Sarah Wilson', 'age' => 29, 'email' => 'sarah.wilson@example.com'],
            ['name' => 'David Martinez', 'age' => 38, 'email' => 'david.m@example.com'],
            ['name' => 'Lisa Anderson', 'age' => 27, 'email' => 'lisa.anderson@example.com'],
            ['name' => 'James Taylor', 'age' => 45, 'email' => 'james.taylor@example.com'],
            ['name' => 'Maria Garcia', 'age' => 33, 'email' => 'maria.garcia@example.com'],
        ];
        foreach ($customers as $customer) {
            DB::table('customer')->insert(array_merge($customer, [
                'created_at' => now(),
                'updated_at' => now(),
            ]));
        }

        // Seed dell table
        $dells = [
            ['city' => 'New York', 'address' => '123 Broadway St', 'username' => 'nyuser1', 'zip_code' => '10001', 'first_name' => 'Alice', 'last_name' => 'Johnson'],
            ['city' => 'Los Angeles', 'address' => '456 Sunset Blvd', 'username' => 'lauser2', 'zip_code' => '90001', 'first_name' => 'Bob', 'last_name' => 'Williams'],
            ['city' => 'Chicago', 'address' => '789 Michigan Ave', 'username' => 'chiuser3', 'zip_code' => '60601', 'first_name' => 'Charlie', 'last_name' => 'Brown'],
            ['city' => 'Houston', 'address' => '321 Main St', 'username' => 'houuser4', 'zip_code' => '77001', 'first_name' => 'Diana', 'last_name' => 'Miller'],
            ['city' => 'Phoenix', 'address' => '654 Desert Rd', 'username' => 'phxuser5', 'zip_code' => '85001', 'first_name' => 'Edward', 'last_name' => 'Davis'],
            ['city' => 'Philadelphia', 'address' => '987 Liberty Ave', 'username' => 'phluser6', 'zip_code' => '19101', 'first_name' => 'Fiona', 'last_name' => 'Wilson'],
            ['city' => 'San Antonio', 'address' => '147 River Walk', 'username' => 'sauser7', 'zip_code' => '78201', 'first_name' => 'George', 'last_name' => 'Moore'],
            ['city' => 'San Diego', 'address' => '258 Ocean Blvd', 'username' => 'sduser8', 'zip_code' => '92101', 'first_name' => 'Hannah', 'last_name' => 'Taylor'],
            ['city' => 'Dallas', 'address' => '369 Commerce St', 'username' => 'daluser9', 'zip_code' => '75201', 'first_name' => 'Isaac', 'last_name' => 'Anderson'],
            ['city' => 'San Jose', 'address' => '741 Tech Dr', 'username' => 'sjuser10', 'zip_code' => '95101', 'first_name' => 'Julia', 'last_name' => 'Thomas'],
        ];
        foreach ($dells as $dell) {
            DB::table('dell')->insert(array_merge($dell, [
                'created_at' => now(),
                'updated_at' => now(),
            ]));
        }

        // Seed vans table
        $vans = [
            ['date_of_birth' => '1990-05-15', 'position' => 'Software Engineer', 'hire_date' => '2020-01-10', 'salary' => 85000.00],
            ['date_of_birth' => '1985-08-22', 'position' => 'Senior Developer', 'hire_date' => '2018-03-15', 'salary' => 95000.00],
            ['date_of_birth' => '1992-11-30', 'position' => 'Project Manager', 'hire_date' => '2019-06-20', 'salary' => 90000.00],
            ['date_of_birth' => '1988-03-12', 'position' => 'Data Analyst', 'hire_date' => '2021-02-05', 'salary' => 75000.00],
            ['date_of_birth' => '1995-07-18', 'position' => 'UI/UX Designer', 'hire_date' => '2022-04-12', 'salary' => 70000.00],
            ['date_of_birth' => '1987-09-25', 'position' => 'DevOps Engineer', 'hire_date' => '2017-11-08', 'salary' => 88000.00],
            ['date_of_birth' => '1993-01-14', 'position' => 'QA Tester', 'hire_date' => '2020-08-22', 'salary' => 65000.00],
            ['date_of_birth' => '1991-06-05', 'position' => 'Marketing Manager', 'hire_date' => '2019-09-15', 'salary' => 82000.00],
            ['date_of_birth' => '1989-12-20', 'position' => 'HR Specialist', 'hire_date' => '2021-05-30', 'salary' => 68000.00],
            ['date_of_birth' => '1994-04-08', 'position' => 'Sales Representative', 'hire_date' => '2022-01-18', 'salary' => 72000.00],
        ];
        foreach ($vans as $van) {
            DB::table('vans')->insert(array_merge($van, [
                'created_at' => now(),
                'updated_at' => now(),
            ]));
        }
    }

    public function down()
    {
        Schema::dropIfExists('customer');
        Schema::dropIfExists('dell');
        Schema::dropIfExists('vans');
    }
};
