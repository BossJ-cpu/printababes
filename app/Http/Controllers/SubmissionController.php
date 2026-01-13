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
        $submission = \App\Models\Submission::findOrFail($id);
        
        $template = \App\Models\PdfTemplate::where('key', $templateKey)->first();
        
        if (!$template || !$template->file_path || !\Illuminate\Support\Facades\Storage::disk('public')->exists($template->file_path)) {
            // Fallback if no template: just dump data or 404
             return response()->json(['error' => "PDF Template '{$templateKey}' not found. Upload one at /pdf-editor"], 404);
        }

        $pdfPath = \Illuminate\Support\Facades\Storage::disk('public')->path($template->file_path);
        
        // Initialize FPDI with millimeters as unit (consistent with other controllers)
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

            $fieldsConfig = $template->fields_config ?? [];
            
            foreach ($fieldsConfig as $fieldName => $config) {
                 if (($config['page'] ?? 1) == $pageNo) {
                     // Try to match submission attribute. 
                     // The submission table has: name, email, age.
                     // The pdf template keys might be anything.
                     // If keys match (name, email), use them.
                     $value = $submission->$fieldName ?? '';
                     
                     $x = floatval($config['x'] ?? 0);
                     $y = floatval($config['y'] ?? 0);
                     $fontSize = floatval($config['size'] ?? 12);
                     
                     $pdf->SetFontSize($fontSize);
                     
                     // Adjust Y coordinate to account for text baseline
                     // Text() places text at baseline, so we add font size to align visually with clicked position
                     $adjustedY = $y + ($fontSize * 0.35); // 0.35 factor accounts for typical font metrics
                     
                     $pdf->Text($x, $adjustedY, (string)$value);
                 }
            }
        }

        return response($pdf->Output('I', 'submission_'.$id.'.pdf'), 200)
            ->header('Content-Type', 'application/pdf');
    }
}
