<?php

namespace App\Services;

use App\Models\PdfTemplate;
use setasign\Fpdi\Fpdi;

class PdfService
{
    public function generate(string $formKey, array $data)
    {
        // 1. Load Configuration
        $template = PdfTemplate::where('key', $formKey)->first();
        
        $fieldsConfig = [];
        $templatePath = '';

        if ($template) {
            // Database source
            $fieldsConfig = $template->fields_config;
            if ($template->template_path) {
                // Ensure we handle absolute paths if they were stored that way during debug
                // But normally we store relative 'templates/file.pdf'
                $templatePath = storage_path('app/' . $template->template_path);
            } else {
                $templatePath = storage_path("app/templates/{$formKey}.pdf");
            }
        } else {
             // Config file fallback
             $config = config("pdf_coordinates.forms.$formKey");
             if (!$config) {
                 throw new \Exception("Form configuration not found: $formKey");
             }
             $fieldsConfig = $config['fields'] ?? [];
             $templatePath = storage_path('app/' . ($config['template_path'] ?? "templates/{$formKey}.pdf"));
        }

        \Log::info("PdfService: Generating PDF using template: $templatePath");

        // 2. Initialize FPDI
        $pdf = new Fpdi();
        
        // 3. Load Template
        // In a real app, this file comes from storage/app/templates/
        // $templatePath is already resolved above
        
        if (!file_exists($templatePath)) {
            // Only create dummy for default paths, never overwrite custom uploads
            if (str_contains(basename($templatePath), $formKey . '_')) {
                 \Log::error("Custom template missing: $templatePath");
                 throw new \Exception("Custom template file not found at: $templatePath");
            }
            $this->createDummyTemplate($templatePath);
        }

        try {
            $pageCount = $pdf->setSourceFile($templatePath);
        } catch (\Exception $e) {
            \Log::error("FPDI setSourceFile failed: " . $e->getMessage());
            throw $e;
        }

        // Loop through all pages
        for ($pageNo = 1; $pageNo <= $pageCount; $pageNo++) {
            $templateId = $pdf->importPage($pageNo);
            
            // 4. Add Page & Import Template
            $pdf->AddPage();
            $pdf->useTemplate($templateId, 0, 0, 210); // A4 width

            // 5. Map Data to Coordinates (Respect Page Number)
            foreach ($fieldsConfig as $key => $fieldConfig) {
                // Default to page 1 if not specified
                $targetPage = $fieldConfig['page'] ?? 1;
                
                if ($targetPage == $pageNo && isset($data[$key])) {
                    $pdf->SetFont($fieldConfig['font'], '', $fieldConfig['size']);
                    $pdf->SetXY($fieldConfig['x'], $fieldConfig['y']);
                    $pdf->Write(0, $data[$key]);
                }
            }
        }

        // 6. Return PDF Content string
        return $pdf->Output('S');
    }

    private function createDummyTemplate($path)
    {
        // Using FPDF basic features to create a "Background" PDF
        if (!is_dir(dirname($path))) {
            mkdir(dirname($path), 0755, true);
        }
        
        $pdf = new \FPDF();
        $pdf->AddPage();
        $pdf->SetFont('Arial', 'B', 16);
        $pdf->Text(50, 50, "Full Name:");
        $pdf->Text(50, 70, "Email:"); // Offset Y to match where we fill
        $pdf->Text(150, 20, "Date:");
        $pdf->Rect(48, 55, 100, 10); // Box for Name
        $pdf->Rect(48, 75, 100, 10); // Box for Email
        
        $pdf->Output('F', $path);
    }
}
