<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\SubmissionController;
use App\Http\Controllers\PdfTemplateController;
use App\Http\Controllers\CoordinateTestController;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::apiResource('submissions', SubmissionController::class);

Route::get('available-tables', [PdfTemplateController::class, 'getAvailableTables']);
Route::get('table-records/{table}', [PdfTemplateController::class, 'getTableRecords']);
Route::get('pdf-templates', [PdfTemplateController::class, 'index']);
Route::post('preview-file', [PdfTemplateController::class, 'previewFile']);
Route::get('pdf-templates/{key}/preview', [PdfTemplateController::class, 'preview']);
Route::get('pdf-templates/{key}/dimensions', [PdfTemplateController::class, 'getDimensions']);
Route::get('pdf-templates/{key}/coordinate-test', [CoordinateTestController::class, 'testCoordinate']);
Route::get('debug/coordinate-echo', function(Illuminate\Http\Request $request) {
    return response()->json([
        'received' => $request->all(),
        'timestamp' => now(),
        'message' => 'Coordinate echo test'
    ]);
});
Route::get('pdf-templates/{key}', [PdfTemplateController::class, 'show']);
Route::put('pdf-templates/{key}', [PdfTemplateController::class, 'update']);
Route::post('pdf-templates/{key}/upload', [PdfTemplateController::class, 'upload']);
Route::delete('pdf-templates/{key}', [PdfTemplateController::class, 'destroy']);

// Database Manager Routes
Route::get('/database/tables', [App\Http\Controllers\DatabaseManagerController::class, 'getTables']);
Route::get('/database/tables/{table}', [App\Http\Controllers\DatabaseManagerController::class, 'getTableData']);
Route::post('/database/tables', [App\Http\Controllers\DatabaseManagerController::class, 'createTable']);
Route::post('/database/tables/{table}/columns', [App\Http\Controllers\DatabaseManagerController::class, 'addColumn']);
Route::delete('/database/tables/{table}', [App\Http\Controllers\DatabaseManagerController::class, 'deleteTable']);
Route::post('/database/rows/{table}', [App\Http\Controllers\DatabaseManagerController::class, 'insertRow']);
Route::put('/database/rows/{table}/{id}', [App\Http\Controllers\DatabaseManagerController::class, 'updateRow']);
Route::delete('/database/rows/{table}/{id}', [App\Http\Controllers\DatabaseManagerController::class, 'deleteRow']);

