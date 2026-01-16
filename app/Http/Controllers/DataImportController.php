<?php

namespace App\Http\Controllers;

use App\Models\DataImport;
use App\Models\PdfTemplate;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;
use Illuminate\Support\Facades\Storage;

class DataImportController extends Controller
{
    public function upload(Request $request, PdfTemplate $template)
    {
        $request->validate([
            'file' => 'required|file|mimes:csv,xlsx,xls|max:10240'
        ]);

        $file = $request->file('file');
        $filename = time() . '_' . $file->getClientOriginalName();
        $path = $file->storeAs('imports', $filename, 'public');

        // Read the file to get columns and row count
        $data = Excel::toArray([], $file)[0];
        $columns = array_shift($data); // First row as headers
        $totalRows = count($data);

        // Delete previous import if exists
        if ($template->dataImport) {
            Storage::disk('public')->delete($template->dataImport->file_path);
            $template->dataImport->delete();
        }

        $import = DataImport::create([
            'pdf_template_id' => $template->id,
            'filename' => $filename,
            'file_path' => $path,
            'columns' => $columns,
            'total_rows' => $totalRows
        ]);

        return response()->json([
            'success' => true,
            'import' => $import,
            'message' => "File uploaded successfully. {$totalRows} records found."
        ]);
    }

    public function getData(PdfTemplate $template)
    {
        $import = $template->dataImport;
        
        if (!$import) {
            return response()->json(['data' => []]);
        }

        $filePath = storage_path('app/public/' . $import->file_path);
        $data = Excel::toArray([], $filePath)[0];
        array_shift($data); // Remove headers

        return response()->json([
            'columns' => $import->columns,
            'data' => $data,
            'total_rows' => $import->total_rows
        ]);
    }

    public function delete(PdfTemplate $template)
    {
        $import = $template->dataImport;
        
        if ($import) {
            Storage::disk('public')->delete($import->file_path);
            $import->delete();
        }

        return response()->json(['success' => true]);
    }
}
