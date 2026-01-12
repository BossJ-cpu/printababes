<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\PdfTemplate;
use Illuminate\Support\Facades\Storage;

class CoordinateTestController extends Controller
{
    public function testCoordinate(Request $request, $key)
    {
        try {
            $template = PdfTemplate::where('key', $key)->firstOrFail();
            
            if (!$template->file_path || !Storage::disk('public')->exists($template->file_path)) {
                return response()->json(['error' => 'PDF not found'], 404);
            }

            $pdfPath = Storage::disk('public')->path($template->file_path);
            
            // Validate coordinates
            $testX = floatval($request->input('x', 50)); // Default to 50mm
            $testY = floatval($request->input('y', 50)); // Default to 50mm
            $testPage = intval($request->input('page', 1)); // Default to page 1
            
            // Validate input ranges
            if ($testX < 0 || $testX > 500 || $testY < 0 || $testY > 500) {
                return response()->json(['error' => 'Invalid coordinates: X and Y must be between 0 and 500mm'], 400);
            }
            
            if ($testPage < 1 || $testPage > 20) {
                return response()->json(['error' => 'Invalid page: must be between 1 and 20'], 400);
            }
            
            // Log the coordinates being received
            \Illuminate\Support\Facades\Log::info("Coordinate Test Debug", [
                'received_x' => $testX,
                'received_y' => $testY,
                'received_page' => $testPage,
                'template_key' => $key,
                'pdf_path' => $pdfPath
            ]);
            
            // Initialize FPDI with millimeters as unit
            $pdf = new \setasign\Fpdi\Fpdi('P', 'mm', 'A4');
            $pdf->SetAutoPageBreak(false);
            
            // Check if file exists and is readable
            if (!file_exists($pdfPath) || !is_readable($pdfPath)) {
                throw new \Exception('PDF file not readable: ' . $pdfPath);
            }
            
            $pageCount = $pdf->setSourceFile($pdfPath);
            
            // Validate that requested page exists
            if ($testPage > $pageCount) {
                return response()->json(['error' => "Page {$testPage} does not exist in PDF (only {$pageCount} pages)"], 400);
            }
            
            for ($pageNo = 1; $pageNo <= $pageCount; $pageNo++) {
                $templateId = $pdf->importPage($pageNo);
                $size = $pdf->getTemplateSize($templateId);
                
                $pdf->AddPage($size['orientation'], array($size['width'], $size['height']));
                $pdf->useTemplate($templateId);
                
                // Only add test marker on the requested page
                if ($pageNo == $testPage) {
                    // Add coordinate crosshair
                    $pdf->SetDrawColor(255, 0, 0); // Red color
                    $pdf->SetLineWidth(0.5);
                    
                    // Draw crosshair lines (5mm each direction)
                    $pdf->Line($testX - 5, $testY, $testX + 5, $testY); // Horizontal
                    $pdf->Line($testX, $testY - 5, $testX, $testY + 5); // Vertical
                    
                    // Add coordinate text
                    $pdf->SetFont('Arial', 'B', 8);
                    $pdf->SetTextColor(255, 0, 0);
                    $pdf->SetXY($testX + 6, $testY - 2);
                    $pdf->Cell(0, 4, "X:{$testX}mm Y:{$testY}mm", 0, 0, 'L');
                    
                    // Add center dot
                    $pdf->SetFillColor(255, 0, 0);
                    $pdf->Rect($testX - 0.5, $testY - 0.5, 1, 1, 'F');
                }
            }

            return response($pdf->Output('S'))
                ->header('Content-Type', 'application/pdf')
                ->header('Content-Disposition', 'inline; filename="coordinate_test.pdf"');
                
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error("Coordinate test failed: " . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'x' => $request->input('x'),
                'y' => $request->input('y'),
                'page' => $request->input('page'),
                'key' => $key
            ]);
            return response()->json(['error' => 'Test failed: ' . $e->getMessage()], 500);
        }
    }
}