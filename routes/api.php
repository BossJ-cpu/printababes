<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\SubmissionController;
use App\Http\Controllers\PdfTemplateController;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::apiResource('submissions', SubmissionController::class);

Route::get('pdf-templates', [PdfTemplateController::class, 'index']);
Route::get('pdf-templates/{key}', [PdfTemplateController::class, 'show']);
Route::put('pdf-templates/{key}', [PdfTemplateController::class, 'update']);
Route::post('pdf-templates/{key}/upload', [PdfTemplateController::class, 'upload']);
Route::delete('pdf-templates/{key}', [PdfTemplateController::class, 'destroy']);
Route::get('pdf-templates/{key}/preview', [PdfTemplateController::class, 'preview']);
