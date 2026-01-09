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
        return PdfTemplate::firstOrCreate(
            ['key' => $key],
            ['fields_config' => []]
        );
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

        $template = PdfTemplate::firstOrCreate(['key' => $key]);

        if ($request->hasFile('pdf')) {
            $path = $request->file('pdf')->store('templates', 'public');
            $template->update(['file_path' => $path]);
        }

        return $template;
    }

    public function preview(Request $request, $key)
    {
        $template = PdfTemplate::where('key', $key)->firstOrFail();
        
        if (!$template->file_path || !Storage::disk('public')->exists($template->file_path)) {
            return response()->json(['error' => 'PDF not found'], 404);
        }

        // Full path to file
        $pdfPath = Storage::disk('public')->path($template->file_path);
        
        // Initialize FPDI
        $pdf = new \setasign\Fpdi\Fpdi();
        $pageCount = $pdf->setSourceFile($pdfPath);

        for ($pageNo = 1; $pageNo <= $pageCount; $pageNo++) {
            $templateId = $pdf->importPage($pageNo);
            $size = $pdf->getTemplateSize($templateId);
            
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
                     $text = $request->input($fieldName, '');
                     
                     $x = $config['x'] ?? 0;
                     $y = $config['y'] ?? 0;
                     $fontSize = $config['size'] ?? 12;
                     
                     $pdf->SetXY($x, $y);
                     $pdf->SetFontSize($fontSize);
                     $pdf->Write(0, $text);
                 }
            }
        }

        return response($pdf->Output('S'), 200)
            ->header('Content-Type', 'application/pdf');
    }

    public function destroy($key)
    {
        $template = PdfTemplate::where('key', $key)->firstOrFail();
        $template->delete();
        return response()->noContent();
    }
}
