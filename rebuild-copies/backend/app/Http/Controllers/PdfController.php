<?php

namespace App\Http\Controllers;

use App\Services\PdfService;
use Illuminate\Http\Request;

class PdfController extends Controller
{
    protected $pdfService;

    public function __construct(PdfService $pdfService)
    {
        $this->pdfService = $pdfService;
    }

    public function generate(Request $request)
    {
        // 1. Get Input (No strict validation for demo purposes, as fields are dynamic)
        $data = $request->all();

        // Add calculated fields
        $data['date'] = now()->format('Y-m-d');

        try {
            // 2. Generate PDF
            $pdfContent = $this->pdfService->generate('user_profile', $data);

            // 3. Return as Stream
            return response($pdfContent, 200, [
                'Content-Type' => 'application/pdf',
                'Content-Disposition' => 'inline; filename="document.pdf"',
            ]);

        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function generateFromSubmission($id)
    {
        $submission = \App\Models\Submission::findOrFail($id);
        
        // Convert model to array
        $data = $submission->toArray();
        $data['date'] = now()->format('Y-m-d');

        try {
            // Generate PDF using the 'user_profile' template key (as per requirements)
            $pdfContent = $this->pdfService->generate('user_profile', $data);

            return response($pdfContent, 200, [
                'Content-Type' => 'application/pdf',
                'Content-Disposition' => 'inline; filename="submission_' . $id . '.pdf"',
            ]);

        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}
