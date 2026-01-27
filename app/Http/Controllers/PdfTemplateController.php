<?php

namespace App\Http\Controllers;

use App\Models\PdfTemplate;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class PdfTemplateController extends Controller
{
    public function getAvailableTables()
    {
        try {
            $tables = PdfTemplate::getAvailableTables();
            return response()->json(['tables' => $tables]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error("Error fetching available tables: " . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch available tables'], 500);
        }
    }

    public function getTableRecords($tableName)
    {
        // Get available tables to validate input
        $allowedTables = PdfTemplate::getAvailableTables();
        
        if (!in_array($tableName, $allowedTables)) {
            return response()->json(['error' => 'Invalid table name'], 400);
        }
        
        try {
            $records = \Illuminate\Support\Facades\DB::table($tableName)->get();
            return response()->json($records);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error("Error fetching table records: " . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch table records'], 500);
        }
    }

    public function index()
    {
        return PdfTemplate::all(['id', 'key', 'name', 'file_path', 'source_table']);
    }

    public function show($key)
    {
        try {
            $template = PdfTemplate::firstOrCreate(
                ['key' => $key],
                ['fields_config' => []]
            );
            
            // Ensure fields_config is always an object/array
            if (is_string($template->fields_config)) {
                $template->fields_config = json_decode($template->fields_config, true) ?? [];
            }
            
            return $template;
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error("Error creating/fetching template: " . $e->getMessage());
            return response()->json(['error' => 'Failed to create or fetch template'], 500);
        }
    }

    public function update(Request $request, $key)
    {
        $template = PdfTemplate::firstOrCreate(['key' => $key]);
        
        $data = ['fields_config' => $request->input('fields_config')];
        
        if ($request->has('file_path')) {
            $data['file_path'] = $request->input('file_path');
        }

        if ($request->has('name')) {
            $data['name'] = $request->input('name');
        }

        if ($request->has('source_table')) {
            $data['source_table'] = $request->input('source_table');
        }

        $template->update($data);

        return $template;
    }

    public function upload(Request $request, $key)
    {
        $request->validate([
            'pdf' => 'required|file|mimes:pdf',
        ]);

        if ($request->hasFile('pdf')) {
            $file = $request->file('pdf');
            $originalPath = $file->store('templates', 'public');
            
            // Absolute path for Ghostscript
            $fullPath = Storage::disk('public')->path($originalPath);
            $tempPath = $fullPath . '_temp.pdf';

            try {
                // Use Ghostscript to convert PDF to version 1.4 which is fully compatible with FPDI
                // -sDEVICE=pdfwrite: output as PDF
                // -dCompatibilityLevel=1.4: target version 1.4
                // -dNOPAUSE -dBATCH: don't pause, exit after processing
                // -dQUIET: suppress stdout
                // On Windows, use gswin32c or gswin64c instead of gs
                $gsCmd = stripos(PHP_OS, 'WIN') === 0 ? 'gswin32c' : 'gs';
                $cmd = "$gsCmd -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dNOPAUSE -dQUIET -dBATCH -sOutputFile=" . escapeshellarg($tempPath) . " " . escapeshellarg($fullPath);
                
                exec($cmd, $output, $returnCode);

                if ($returnCode === 0 && file_exists($tempPath)) {
                    // Success, replace original file with repaired one
                    unlink($fullPath);
                    rename($tempPath, $fullPath);
                } else {
                    \Illuminate\Support\Facades\Log::warning("Ghostscript conversion failed for $key", ['return' => $returnCode, 'output' => $output]);
                    if (file_exists($tempPath)) unlink($tempPath);
                }
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::error("Ghostscript attempt failed: " . $e->getMessage());
                // Continue with original file if GS fails
            }

            // Return only the file path without saving to database
            // The frontend will store this temporarily and save it when user clicks "Save Template"
            return response()->json([
                'file_path' => $originalPath,
                'message' => 'File uploaded successfully. Click "Save Template" to save changes.'
            ]);
        }

        return response()->json(['error' => 'No file uploaded'], 400);
    }

    public function preview(Request $request, $key)
    {
        try {
            $template = PdfTemplate::where('key', $key)->first();
            
            if (!$template) {
                return response()->json(['error' => 'Template not found'], 404);
            }
            
            if (!$template->file_path || !Storage::disk('public')->exists($template->file_path)) {
                return response()->json(['error' => 'PDF file not found'], 404);
            }

            // Full path to file
            $pdfPath = Storage::disk('public')->path($template->file_path);
            
            // Log the attempt
            \Illuminate\Support\Facades\Log::info("PDF Preview attempt", [
                'key' => $key,
                'file_path' => $template->file_path,
                'pdf_path' => $pdfPath,
                'file_exists' => file_exists($pdfPath)
            ]);
            
            // Initialize FPDI with explicit millimeters unit for consistency
            // We use 'mm' to match the coordinate system used in the editor
            $pdf = new \setasign\Fpdi\Fpdi('P', 'mm');
            
            // Disable Auto Page Break to prevent unwanted page jumps at bottom
            $pdf->SetAutoPageBreak(false);
            
            $pageCount = $pdf->setSourceFile($pdfPath);

            for ($pageNo = 1; $pageNo <= $pageCount; $pageNo++) {
                $templateId = $pdf->importPage($pageNo);
                $size = $pdf->getTemplateSize($templateId);
                
                // Log the actual PDF dimensions for debugging
                \Illuminate\Support\Facades\Log::info("=== PDF TEMPLATE DIMENSIONS ===");
                \Illuminate\Support\Facades\Log::info("PDF Page Info", [
                    'template_key' => $key,
                    'page' => $pageNo,
                    'width_mm' => $size['width'],
                    'height_mm' => $size['height'],
                    'orientation' => $size['orientation']
                ]);
                \Illuminate\Support\Facades\Log::info("================================");
                
                // AddPage using the imported size
                $pdf->AddPage($size['orientation'], array($size['width'], $size['height']));
                $pdf->useTemplate($templateId);
                
                $pdf->SetFont('Arial', '', 12);
                $pdf->SetTextColor(0, 0, 0);

                $fieldsConfig = $template->fields_config ?? [];
                if (is_string($fieldsConfig)) {
                    $fieldsConfig = json_decode($fieldsConfig, true);
                }

                foreach ($fieldsConfig as $fieldName => $config) {
                     if (($config['page'] ?? 1) == $pageNo) {
                         // Get value from request or use placeholder
                         $text = $request->input($fieldName);
                         
                         // Fallback: If no value provided in request, show the field name as placeholder
                         if ($text === null || $text === '') {
                            $text = "[$fieldName]";
                         }
                         
                         $text = (string)$text;

                         $x = floatval($config['x'] ?? 0);
                         $y = floatval($config['y'] ?? 0);
                         $fontSize = floatval($config['size'] ?? 12);
                         
                         $pdf->SetFontSize($fontSize);
                        
                        // Adjust Y coordinate to center text vertically on the clicked position
                        // Text() places text at baseline, adjust to center the visual text height
                        $adjustedY = $y + ($fontSize * 0.25); // Fine-tuned for visual centering
                        
                        // Center-align text: calculate width and adjust X position
                        $textWidth = $pdf->GetStringWidth($text);
                        $centeredX = $x - ($textWidth / 2);
                        
                        $pdf->Text($centeredX, $adjustedY, $text);
                     }
                }
            }

            return response($pdf->Output('S'), 200)
                ->header('Content-Type', 'application/pdf');
                
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error("PDF Preview Error", [
                'key' => $key,
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'error' => 'Error processing PDF: ' . $e->getMessage(),
                'details' => 'Check server logs for more information'
            ], 500);
        }
    }
    
    public function getDimensions($key)
    {
        try {
            $template = PdfTemplate::where('key', $key)->firstOrFail();
            
            if (!$template->file_path || !Storage::disk('public')->exists($template->file_path)) {
                return response()->json(['error' => 'PDF not found'], 404);
            }

            $pdfPath = Storage::disk('public')->path($template->file_path);
            
            // Initialize FPDI with explicit millimeters unit for consistency
            $pdf = new \setasign\Fpdi\Fpdi('P', 'mm');
            $pageCount = $pdf->setSourceFile($pdfPath);
            
            $dimensions = [];
            for ($pageNo = 1; $pageNo <= $pageCount; $pageNo++) {
                $templateId = $pdf->importPage($pageNo);
                $size = $pdf->getTemplateSize($templateId);
                
                $dimensions[$pageNo] = [
                    'width' => $size['width'],
                    'height' => $size['height'],
                    'orientation' => $size['orientation']
                ];
            }
            
            return response()->json([
                'dimensions' => $dimensions,
                'pageCount' => $pageCount
            ]);
            
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error("PDF Dimensions Error", [
                'key' => $key,
                'message' => $e->getMessage()
            ]);
            
            return response()->json(['error' => 'Failed to get PDF dimensions'], 500);
        }
    }

    public function destroy($key)
    {
        $template = PdfTemplate::where('key', $key)->firstOrFail();
        $template->delete();
        return response()->noContent();
    }

    /**
     * Preview a PDF file directly without requiring a database record.
     * Used for previewing newly uploaded files before saving the template.
     */
    public function previewFile(Request $request)
    {
        try {
            $filePath = $request->input('file_path');
            
            if (!$filePath) {
                return response()->json(['error' => 'file_path parameter is required'], 400);
            }
            
            if (!Storage::disk('public')->exists($filePath)) {
                return response()->json(['error' => 'PDF file not found'], 404);
            }

            $pdfPath = Storage::disk('public')->path($filePath);
            
            // Initialize FPDI
            $pdf = new \setasign\Fpdi\Fpdi('P', 'mm');
            $pdf->SetAutoPageBreak(false);
            
            $pageCount = $pdf->setSourceFile($pdfPath);

            for ($pageNo = 1; $pageNo <= $pageCount; $pageNo++) {
                $templateId = $pdf->importPage($pageNo);
                $size = $pdf->getTemplateSize($templateId);
                
                $pdf->AddPage($size['orientation'], array($size['width'], $size['height']));
                $pdf->useTemplate($templateId);
                
                $pdf->SetFont('Arial', '', 12);
                $pdf->SetTextColor(0, 0, 0);

                // Get fields from request
                $fieldsConfig = $request->input('fields_config', []);
                if (is_string($fieldsConfig)) {
                    $fieldsConfig = json_decode($fieldsConfig, true) ?? [];
                }

                foreach ($fieldsConfig as $fieldName => $config) {
                     if (($config['page'] ?? 1) == $pageNo) {
                         $text = $request->input($fieldName);
                         
                         if ($text === null || $text === '') {
                            $text = "[$fieldName]";
                         }
                         
                         $text = (string)$text;
                         $x = floatval($config['x'] ?? 0);
                         $y = floatval($config['y'] ?? 0);
                         $fontSize = floatval($config['size'] ?? 12);
                         
                         $pdf->SetFontSize($fontSize);
                        
                        // Center text vertically on the clicked position
                        $adjustedY = $y + ($fontSize * 0.25);
                        $textWidth = $pdf->GetStringWidth($text);
                        $centeredX = $x - ($textWidth / 2);
                        
                        $pdf->Text($centeredX, $adjustedY, $text);
                     }
                }
            }

            return response($pdf->Output('S'), 200)
                ->header('Content-Type', 'application/pdf');
                
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error("PDF File Preview Error", [
                'file_path' => $request->input('file_path'),
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'error' => 'Error processing PDF: ' . $e->getMessage()
            ], 500);
        }
    }

    public function generateBulk(PdfTemplate $template)
    {
        try {
            $import = $template->dataImport;
            
            if (!$import) {
                return response()->json(['error' => 'No data import found'], 400);
            }

            if (!$template->file_path) {
                return response()->json(['error' => 'No PDF template uploaded'], 400);
            }

            // Read data from CSV/Excel file
            $filePath = storage_path('app/public/' . $import->file_path);
            
            if (!file_exists($filePath)) {
                return response()->json(['error' => 'Import file not found at: ' . $filePath], 404);
            }

            $allData = \Maatwebsite\Excel\Facades\Excel::toArray([], $filePath)[0];
            $headers = array_shift($allData);
            
            \Illuminate\Support\Facades\Log::info('Bulk PDF Generation Started', [
                'template_id' => $template->id,
                'total_rows' => count($allData),
                'headers' => $headers,
                'fields_config' => $template->fields_config
            ]);
            
            $pdfSourcePath = storage_path('app/public/' . $template->file_path);
            
            if (!file_exists($pdfSourcePath)) {
                return response()->json(['error' => 'PDF template file not found at: ' . $pdfSourcePath], 404);
            }

            // Create session directory for this batch
            $sessionId = 'bulk_' . $template->key . '_' . time();
            $sessionDir = 'generated/' . $sessionId;
            
            if (!Storage::disk('public')->exists($sessionDir)) {
                Storage::disk('public')->makeDirectory($sessionDir);
            }

            $generatedFiles = [];

            // Generate individual PDFs for each row
            foreach ($allData as $rowIndex => $rowData) {
                // Create new PDF for this record
                $pdf = new \setasign\Fpdi\Fpdi('P', 'mm');
                $pdf->SetAutoPageBreak(false);
                
                $pageCount = $pdf->setSourceFile($pdfSourcePath);
                
                for ($pageNo = 1; $pageNo <= $pageCount; $pageNo++) {
                    $templateId = $pdf->importPage($pageNo);
                    $size = $pdf->getTemplateSize($templateId);
                    
                    $pdf->AddPage($size['orientation'], array($size['width'], $size['height']));
                    $pdf->useTemplate($templateId);
                    
                    $pdf->SetFont('Arial', '', 12);
                    $pdf->SetTextColor(0, 0, 0);

                    // Get fields from template configuration
                    $fieldsConfig = $template->fields_config ?? [];
                    
                    foreach ($fieldsConfig as $fieldName => $config) {
                        // Only process fields for this page that have CSV column mapping
                        if (($config['page'] ?? 1) == $pageNo && isset($config['csv_index'])) {
                            $columnIndex = intval($config['csv_index']);
                            $value = $rowData[$columnIndex] ?? '';
                            
                            $x = floatval($config['x'] ?? 0);
                            $y = floatval($config['y'] ?? 0);
                            $fontSize = floatval($config['size'] ?? 12);
                            
                            $pdf->SetFontSize($fontSize);
                            
                            // Center text vertically
                            $adjustedY = $y + ($fontSize * 0.25);
                            $textWidth = $pdf->GetStringWidth($value);
                            $centeredX = $x - ($textWidth / 2);
                            
                            $pdf->Text($centeredX, $adjustedY, $value);
                        }
                    }
                }

                // Save individual PDF
                $filename = 'record_' . ($rowIndex + 1) . '.pdf';
                $filePath = $sessionDir . '/' . $filename;
                $fullPath = storage_path('app/public/' . $filePath);
                
                $pdf->Output('F', $fullPath);
                $generatedFiles[] = $filePath;
                
                \Illuminate\Support\Facades\Log::info("Generated PDF for record " . ($rowIndex + 1));
            }

            // Return JSON with all file paths
            return response()->json([
                'success' => true,
                'session_id' => $sessionId,
                'files' => $generatedFiles,
                'total_records' => count($allData),
                'message' => 'Generated ' . count($allData) . ' PDFs successfully'
            ]);
            
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Bulk PDF generation error: ' . $e->getMessage(), [
                'template_id' => $template->id,
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'error' => 'Error generating bulk PDF: ' . $e->getMessage()
            ], 500);
        }
    }

    public function viewSinglePdf($sessionId, $index)
    {
        try {
            $filePath = "generated/{$sessionId}/record_{$index}.pdf";
            
            if (!Storage::disk('public')->exists($filePath)) {
                return response()->json(['error' => 'PDF not found'], 404);
            }

            $fullPath = storage_path('app/public/' . $filePath);
            
            return response()->file($fullPath, [
                'Content-Type' => 'application/pdf',
                'Content-Disposition' => 'inline',
                'Access-Control-Allow-Origin' => '*'
            ]);
            
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Single PDF view error: ' . $e->getMessage());
            return response()->json(['error' => 'View failed'], 500);
        }
    }

    public function downloadSinglePdf($sessionId, $index)
    {
        try {
            $filePath = "generated/{$sessionId}/record_{$index}.pdf";
            
            if (!Storage::disk('public')->exists($filePath)) {
                return response()->json(['error' => 'PDF not found'], 404);
            }

            $fullPath = storage_path('app/public/' . $filePath);
            
            // Determine filename based on template name
            $downloadName = "record_{$index}.pdf"; // Default fallback
            
            // Try to extract template key and get name
            // Session ID format: bulk_{key}_{timestamp}
            if (preg_match('/^bulk_(.+)_\d+$/', $sessionId, $matches)) {
                 $key = $matches[1];
                 $template = PdfTemplate::where('key', $key)->first();
                 if ($template && $template->name) {
                     // Sanitize name for filename
                     $safeName = preg_replace('/[^a-zA-Z0-9_-]/', '_', $template->name);
                     $downloadName = "{$safeName}_no.{$index}.pdf";
                 }
            }

            return response()->download($fullPath, $downloadName, [
                'Content-Type' => 'application/pdf',
                'Access-Control-Allow-Origin' => '*'
            ]);
            
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Single PDF download error: ' . $e->getMessage());
            return response()->json(['error' => 'Download failed'], 500);
        }
    }

    public function downloadAllPdfsAsZip($sessionId)
    {
        try {
            $sessionDir = "generated/{$sessionId}";
            
            if (!Storage::disk('public')->exists($sessionDir)) {
                return response()->json(['error' => 'Session not found'], 404);
            }

            $files = Storage::disk('public')->files($sessionDir);
            
            if (empty($files)) {
                return response()->json(['error' => 'No files found'], 404);
            }

            // Create ZIP file
            $zipFileName = $sessionId . '.zip';
            $zipPath = storage_path('app/public/generated/' . $zipFileName);
            
            $zip = new \ZipArchive();

            // Determine naming scheme for zip entries
            $templateName = null;
            if (preg_match('/^bulk_(.+)_\d+$/', $sessionId, $matches)) {
                 $key = $matches[1];
                 $template = PdfTemplate::where('key', $key)->first();
                 if ($template && $template->name) {
                     $templateName = preg_replace('/[^a-zA-Z0-9_-]/', '_', $template->name);
                 }
            }
            
            if ($zip->open($zipPath, \ZipArchive::CREATE | \ZipArchive::OVERWRITE) === TRUE) {
                foreach ($files as $file) {
                    $fullPath = storage_path('app/public/' . $file);
                    $fileName = basename($file);
                    
                    // Rename entry if template name exists
                    $entryName = $fileName;
                    if ($templateName && preg_match('/^record_(\d+)\.pdf$/', $fileName, $fMatches)) {
                        $idx = $fMatches[1];
                        $entryName = "{$templateName}_no.{$idx}.pdf";
                    }

                    $zip->addFile($fullPath, $entryName);
                }
                $zip->close();
            } else {
                throw new \Exception('Failed to create ZIP file');
            }

            return response()->download($zipPath, $zipFileName, [
                'Content-Type' => 'application/zip',
                'Access-Control-Allow-Origin' => '*'
            ])->deleteFileAfterSend(true);
            
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('ZIP download error: ' . $e->getMessage());
            return response()->json(['error' => 'ZIP creation failed: ' . $e->getMessage()], 500);
        }
    }
}
