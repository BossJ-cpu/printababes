<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\SubmissionController;

Route::get('/', function () {
    return view('welcome');
});

// Route::get('/app/generate-submission-pdf/{id}', [SubmissionController::class, 'generatePdf']);
Route::match(['get', 'head'], '/app/generate-submission-pdf/{id}/{templateKey?}', [SubmissionController::class, 'generatePdf']);
