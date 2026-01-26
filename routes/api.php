<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\SubmissionController;
use App\Http\Controllers\PdfTemplateController;
use App\Http\Controllers\CoordinateTestController;
use App\Http\Controllers\DataImportController;
use App\Http\Controllers\ErpController;

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

// Data Import routes for CSV/Excel bulk generation
Route::post('templates/{template}/import', [DataImportController::class, 'upload']);
Route::get('templates/{template}/import/data', [DataImportController::class, 'getData']);
Route::delete('templates/{template}/import', [DataImportController::class, 'delete']);
Route::post('templates/{template}/generate-bulk', [PdfTemplateController::class, 'generateBulk']);
Route::get('bulk-view/{sessionId}/{index}', [PdfTemplateController::class, 'viewSinglePdf']);
Route::get('bulk-download/{sessionId}/{index}', [PdfTemplateController::class, 'downloadSinglePdf']);
Route::get('bulk-download-all/{sessionId}', [PdfTemplateController::class, 'downloadAllPdfsAsZip']);

// Database Manager Routes
Route::get('/database/tables', [App\Http\Controllers\DatabaseManagerController::class, 'getTables']);
Route::get('/database/tables/{table}', [App\Http\Controllers\DatabaseManagerController::class, 'getTableData']);
Route::post('/database/tables', [App\Http\Controllers\DatabaseManagerController::class, 'createTable']);
Route::post('/database/tables/{table}/columns', [App\Http\Controllers\DatabaseManagerController::class, 'addColumn']);
Route::delete('/database/tables/{table}', [App\Http\Controllers\DatabaseManagerController::class, 'deleteTable']);
Route::post('/database/rows/{table}', [App\Http\Controllers\DatabaseManagerController::class, 'insertRow']);
Route::put('/database/rows/{table}/{id}', [App\Http\Controllers\DatabaseManagerController::class, 'updateRow']);
Route::delete('/database/rows/{table}/{id}', [App\Http\Controllers\DatabaseManagerController::class, 'deleteRow']);

// PDF Generation route (needs CORS support)
Route::match(['get', 'head'], '/generate-submission-pdf/{id}/{templateKey?}', [SubmissionController::class, 'generatePdf']);

// ERPNext Integration Routes
Route::get('/erp/status', [ErpController::class, 'status']);
Route::get('/erp/doctypes', [ErpController::class, 'getDocTypes']);
Route::get('/erp/records/{doctype}', [ErpController::class, 'getRecords']);
Route::get('/erp/records/{doctype}/{name}', [ErpController::class, 'getRecord']);
Route::post('/erp/generate-pdfs', [ErpController::class, 'generatePdfs']);

// ERP Reports (for template editor)
Route::get('/erp/reports', [ErpController::class, 'getReports']);
Route::get('/erp/report-columns', [ErpController::class, 'getReportColumns']);
Route::get('/erp/report-data', [ErpController::class, 'getReportData']);
Route::get('/erp/companies', [ErpController::class, 'getCompanies']);
Route::get('/erp/templates', [ErpController::class, 'getTemplates']);
Route::post('/erp/templates', [ErpController::class, 'saveTemplate']);
Route::post('/erp/generate-pdf', [ErpController::class, 'generateSinglePdf']);

// ERP Templates (reuse pdf-templates with doctype field)
Route::get('erp-templates', [PdfTemplateController::class, 'indexErpTemplates']);
Route::get('erp-templates/{key}', [PdfTemplateController::class, 'show']);
Route::put('erp-templates/{key}', [PdfTemplateController::class, 'updateErpTemplate']);
Route::post('erp-templates/{key}/upload', [PdfTemplateController::class, 'upload']);
