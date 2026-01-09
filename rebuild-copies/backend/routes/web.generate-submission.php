<?php

// Copy of the generate-submission PDF route from routes/web.php
// (Saved separately so you can rebuild without affecting the live routes.)

use Illuminate\Support\Facades\Route;

Route::get('/app/generate-submission-pdf/{id}', [\App\Http\Controllers\PdfController::class, 'generateFromSubmission']);
