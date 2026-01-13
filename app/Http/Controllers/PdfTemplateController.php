<?php

namespace App\Http\Controllers;

use App\Models\PdfTemplate;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class PdfTemplateController extends Controller
{
    public function index()
    {
        return PdfTemplate::all(['id', 'key', 'name', 'file_path']);
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
                $cmd = "gs -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dNOPAUSE -dQUIET -dBATCH -sOutputFile=" . escapeshellarg($tempPath) . " " . escapeshellarg($fullPath);
                
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
            $template = PdfTemplate::where('key', $key)->firstOrFail();
            
            if (!$template->file_path || !Storage::disk('public')->exists($template->file_path)) {
                return response()->json(['error' => 'PDF not found'], 404);
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
                        
                        // Adjust Y coordinate to account for text baseline
                        // Text() places text at baseline, so we add font size to align visually with clicked position
                        $adjustedY = $y + ($fontSize * 0.35); // 0.35 factor accounts for typical font metrics
                        
                        $pdf->Text($x, $adjustedY, $text);
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
}
