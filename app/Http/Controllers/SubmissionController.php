<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class SubmissionController extends Controller
{
    public function index()
    {
        return \App\Models\Submission::all();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string',
            'email' => 'required|email',
            'age' => 'nullable|integer',
        ]);

        return \App\Models\Submission::create($validated);
    }

    public function generatePdf($id, $templateKey = 'user_profile')
    {
        $headers = [
            'Access-Control-Allow-Origin' => '*',
            'Access-Control-Allow-Methods' => 'GET, HEAD, OPTIONS',
            'Access-Control-Allow-Headers' => 'Content-Type, Authorization, Bypass-Tunnel-Reminder, ngrok-skip-browser-warning',
        ];

        $template = \App\Models\PdfTemplate::where('key', $templateKey)
            ->orWhere('name', $templateKey)
            ->first();
        
        if (!$template) {
            return response()->json(['error' => "PDF Template '{$templateKey}' not found. Upload one at /pdf-editor"], 404)->withHeaders($headers);
        }
        
        if (!$template->file_path || !\Illuminate\Support\Facades\Storage::disk('public')->exists($template->file_path)) {
            return response()->json(['error' => "PDF template file is missing. Please upload a PDF file for template '{$templateKey}' in the PDF Editor."], 404)->withHeaders($headers);
        }

        // Get the source table for this template
        $sourceTable = $template->source_table;
        
        if (!$sourceTable) {
            // Fallback to old behavior - use submissions table
            $record = \App\Models\Submission::find($id);
            if (!$record) {
                 return response()->json(['error' => "Submission #{$id} not found"], 404)->withHeaders($headers);
            }
            $recordData = $record->toArray();
        } else {
            // Use the configured source table
            $record = \Illuminate\Support\Facades\DB::table($sourceTable)->find($id);
            
            if (!$record) {
                return response()->json(['error' => "Record #{$id} not found in table '{$sourceTable}'"], 404)->withHeaders($headers);
            }
            
            $recordData = (array) $record;
        }

        $pdfPath = \Illuminate\Support\Facades\Storage::disk('public')->path($template->file_path);
        
        // Initialize FPDI with millimeters as unit (consistent with other controllers)
        try {
            $pdf = new \setasign\Fpdi\Fpdi('P', 'mm');
            $pdf->SetAutoPageBreak(false);
            $pageCount = $pdf->setSourceFile($pdfPath);
        } catch (\Exception $e) {
             return response()->json(['error' => "Error loading PDF template: " . $e->getMessage()], 500)->withHeaders($headers);
        }

        for ($pageNo = 1; $pageNo <= $pageCount; $pageNo++) {
            $templateId = $pdf->importPage($pageNo);
            $size = $pdf->getTemplateSize($templateId);
            
            $pdf->AddPage($size['orientation'], array($size['width'], $size['height']));
            $pdf->useTemplate($templateId);
            
            $pdf->SetFont('Arial', '', 12);
            $pdf->SetTextColor(0, 0, 0);

            $fieldsConfig = $template->fields_config ?? [];
            
            foreach ($fieldsConfig as $fieldName => $config) {
                 if (($config['page'] ?? 1) == $pageNo) {
                     // Check if field name is a number (1, 2, 3, etc.)
                     if (is_numeric($fieldName)) {
                         // Field number system - map to column position
                         $columnIndex = (int)$fieldName - 1; // Convert 1-based to 0-based
                         $columns = array_values($recordData);
                         $value = $columns[$columnIndex] ?? '';
                     } else {
                         // Named field - try to match column name
                         $value = $recordData[$fieldName] ?? '';
                     }
                     
                     $x = floatval($config['x'] ?? 0);
                     $y = floatval($config['y'] ?? 0);
                     $fontSize = floatval($config['size'] ?? 12);
                     
                     $pdf->SetFontSize($fontSize);
                     
                     // Adjust Y coordinate to account for text baseline
                     $adjustedY = $y + ($fontSize * 0.35);
                     
                     // Center-align text
                     $textWidth = $pdf->GetStringWidth((string)$value);
                     $centeredX = $x - ($textWidth / 2);
                     
                     $pdf->Text($centeredX, $adjustedY, (string)$value);
                 }
            }
        }

        // Use 'S' to return the document as a string so Laravel can handle headers
        $pdfContent = $pdf->Output('S');

        return response($pdfContent, 200)
            ->header('Content-Type', 'application/pdf')
            ->header('Content-Disposition', 'inline; filename="generated_'.$id.'.pdf"')
            ->withHeaders($headers);
    }
}
