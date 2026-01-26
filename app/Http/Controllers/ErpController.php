<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use App\Services\ErpService;
use App\Models\PdfTemplate;
use setasign\Fpdi\Fpdi;

class ErpController extends Controller
{
    protected $erpService;

    public function __construct(ErpService $erpService)
    {
        $this->erpService = $erpService;
    }

    /**
     * Check ERP connection status
     */
    public function status()
    {
        $baseUrl = config('services.erp.base_url');
        $key = config('services.erp.key');
        
        $connected = !empty($baseUrl) && !empty($key);
        
        return response()->json([
            'connected' => $connected,
            'base_url' => $connected ? $baseUrl : null,
            'message' => $connected ? 'ERPNext credentials configured' : 'ERPNext credentials not configured'
        ]);
    }

    /**
     * Get records from ERPNext for a specific DocType
     */
    public function getRecords(string $doctype)
    {
        try {
            $records = $this->erpService->getRecords($doctype);
            
            return response()->json([
                'success' => true,
                'records' => $records,
                'count' => count($records)
            ]);
        } catch (\Exception $e) {
            Log::error('ERP getRecords error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch records from ERPNext: ' . $e->getMessage(),
                'records' => []
            ], 500);
        }
    }

    /**
     * Get a single record from ERPNext
     */
    public function getRecord(string $doctype, string $name)
    {
        try {
            $record = $this->erpService->getRecord($doctype, $name);
            
            return response()->json([
                'success' => true,
                'record' => $record
            ]);
        } catch (\Exception $e) {
            Log::error('ERP getRecord error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch record from ERPNext'
            ], 500);
        }
    }

    /**
     * Generate PDFs from ERP records
     */
    public function generatePdfs(Request $request)
    {
        $request->validate([
            'template_key' => 'required|string',
            'doctype' => 'required|string',
            'record_names' => 'required|array|min:1'
        ]);

        $templateKey = $request->input('template_key');
        $doctype = $request->input('doctype');
        $recordNames = $request->input('record_names');

        try {
            // Get template
            $template = PdfTemplate::where('key', $templateKey)->first();
            if (!$template) {
                return response()->json([
                    'success' => false,
                    'message' => 'Template not found'
                ], 404);
            }

            $fieldsConfig = $template->fields_config ?? [];
            $pdfPath = storage_path('app/public/' . $template->file_path);

            if (!file_exists($pdfPath)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Template PDF file not found'
                ], 404);
            }

            $sessionId = uniqid('erp_bulk_');
            $outputDir = storage_path("app/public/bulk_pdfs/{$sessionId}");
            if (!is_dir($outputDir)) {
                mkdir($outputDir, 0755, true);
            }

            $pdfUrls = [];

            foreach ($recordNames as $index => $name) {
                // Fetch record from ERP
                $record = $this->erpService->getRecord($doctype, $name);
                
                if (!$record) {
                    Log::warning("ERP record not found: {$doctype}/{$name}");
                    continue;
                }

                // Generate PDF
                $pdf = new Fpdi();
                $pageCount = $pdf->setSourceFile($pdfPath);

                for ($pageNo = 1; $pageNo <= $pageCount; $pageNo++) {
                    $tplId = $pdf->importPage($pageNo);
                    $size = $pdf->getTemplateSize($tplId);
                    $pdf->AddPage($size['orientation'], [$size['width'], $size['height']]);
                    $pdf->useTemplate($tplId, 0, 0, $size['width'], $size['height']);
                    $pdf->SetFont('Arial', '', 12);

                    // Add fields for this page
                    foreach ($fieldsConfig as $fieldKey => $config) {
                        $fieldPage = $config['page'] ?? 1;
                        if ($fieldPage != $pageNo) continue;

                        // Get the base field name (remove _1, _2 suffixes)
                        $baseField = preg_replace('/_\d+$/', '', $fieldKey);
                        
                        // Get value from ERP record
                        $value = $record[$baseField] ?? $record[$fieldKey] ?? '';
                        
                        if (empty($value)) continue;

                        $x = $config['x'] ?? 10;
                        $y = $config['y'] ?? 10;
                        $fontSize = $config['size'] ?? 12;
                        // Width is stored in pixels, convert to mm (approximately 3.78 pixels per mm at 96 DPI)
                        $widthPx = $config['width'] ?? 0;
                        $width = $widthPx > 0 ? $widthPx / 3.78 : 0;
                        $wrapText = $config['wrap_text'] ?? false;
                        // Get alignment (default to 'left')
                        $align = $config['align'] ?? 'left';

                        $pdf->SetFontSize($fontSize);
                        
                        // Calculate X position based on alignment
                        $startX = $x;
                        if ($width > 0) {
                            if ($align === 'center') {
                                $startX = $x - ($width / 2);
                            } elseif ($align === 'right') {
                                $startX = $x - $width;
                            }
                            $startX = max(0, $startX);
                        }
                        
                        // Map alignment to FPDF alignment codes
                        $fpdfAlign = 'L';
                        if ($align === 'center') {
                            $fpdfAlign = 'C';
                        } elseif ($align === 'right') {
                            $fpdfAlign = 'R';
                        }
                        
                        if ($wrapText && $width > 0) {
                            $pdf->SetXY($startX, $y);
                            $lineHeight = $fontSize * 0.4;
                            $pdf->MultiCell($width, $lineHeight, (string)$value, 0, $fpdfAlign);
                        } else if ($width > 0) {
                            $pdf->SetXY($startX, $y);
                            $pdf->Cell($width, $fontSize / 2, (string)$value, 0, 0, $fpdfAlign);
                        } else {
                            $pdf->SetXY($x, $y);
                            $pdf->Write(0, (string)$value);
                        }
                    }
                }

                // Save PDF
                $safeName = preg_replace('/[^a-zA-Z0-9_-]/', '_', $name);
                $outputPath = "{$outputDir}/{$safeName}.pdf";
                $pdf->Output($outputPath, 'F');

                $pdfUrls[] = url("/storage/bulk_pdfs/{$sessionId}/{$safeName}.pdf");
            }

            return response()->json([
                'success' => true,
                'session_id' => $sessionId,
                'pdf_urls' => $pdfUrls,
                'total_generated' => count($pdfUrls)
            ]);

        } catch (\Exception $e) {
            Log::error('ERP PDF generation error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to generate PDFs: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get available DocTypes (for future dynamic fetching)
     */
    public function getDocTypes()
    {
        // For now, return a static list
        $docTypes = [
            'Sales Invoice',
            'Sales Order',
            'Customer',
            'Quotation',
            'Delivery Note',
            'Purchase Invoice',
            'Purchase Order',
            'Item',
        ];

        return response()->json([
            'success' => true,
            'doctypes' => $docTypes
        ]);
    }

    /**
     * Get available ERP reports
     */
    public function getReports()
    {
        $reports = [
            ['name' => 'Sales Payment Summary'],
            ['name' => 'General Ledger'],
            ['name' => 'Accounts Receivable'],
            ['name' => 'Sales Register'],
            ['name' => 'Sales Invoice Trends'],
            ['name' => 'Purchase Analytics'],
            ['name' => 'Stock Ledger'],
            ['name' => 'Item-wise Sales Register'],
            ['name' => 'Accounts Payable'],
            ['name' => 'Customer Ledger Summary'],
        ];

        return response()->json([
            'success' => true,
            'reports' => $reports
        ]);
    }

    /**
     * Get report columns for a specific report
     */
    public function getReportColumns(Request $request)
    {
        $reportName = $request->query('report');
        $debugError = null;

        // Try to fetch actual columns from ERPNext
        if ($this->erpService->isConfigured()) {
            try {
                $reportData = $this->erpService->getReportData($reportName, [
                    'from_date' => date('Y-m-d', strtotime('-1 year')),
                    'to_date' => date('Y-m-d'),
                ]);
                
                if ($reportData && isset($reportData['columns'])) {
                    $columns = [];
                    foreach ($reportData['columns'] as $col) {
                        if (is_array($col)) {
                            $columns[] = [
                                'fieldname' => $col['fieldname'] ?? $col['field_name'] ?? '',
                                'label' => $col['label'] ?? $col['fieldname'] ?? '',
                                'fieldtype' => $col['fieldtype'] ?? 'Data',
                            ];
                        } else if (is_string($col)) {
                            $parts = explode(':', $col);
                            $columns[] = [
                                'fieldname' => $parts[0] ?? $col,
                                'label' => ucfirst(str_replace('_', ' ', $parts[0] ?? $col)),
                                'fieldtype' => $parts[1] ?? 'Data',
                            ];
                        }
                    }
                    
                    if (!empty($columns)) {
                        return response()->json([
                            'success' => true,
                            'columns' => $columns,
                            'source' => 'erpnext'
                        ]);
                    }
                }
            } catch (\Exception $e) {
                Log::warning('Failed to fetch report columns from ERP: ' . $e->getMessage());
                $debugError = $e->getMessage();
            }
        } else {
            $debugError = 'ERP not configured';
        }
        
        // Fallback column definitions for different reports
        $reportColumns = [
            'Sales Payment Summary' => [
                ['fieldname' => 'posting_date', 'label' => 'Posting Date', 'fieldtype' => 'Date'],
                ['fieldname' => 'customer', 'label' => 'Customer', 'fieldtype' => 'Link'],
                ['fieldname' => 'customer_name', 'label' => 'Customer Name', 'fieldtype' => 'Data'],
                ['fieldname' => 'mode_of_payment', 'label' => 'Mode of Payment', 'fieldtype' => 'Link'],
                ['fieldname' => 'paid_amount', 'label' => 'Paid Amount', 'fieldtype' => 'Currency'],
                ['fieldname' => 'outstanding_amount', 'label' => 'Outstanding Amount', 'fieldtype' => 'Currency'],
            ],
            'General Ledger' => [
                ['fieldname' => 'posting_date', 'label' => 'Posting Date', 'fieldtype' => 'Date'],
                ['fieldname' => 'account', 'label' => 'Account', 'fieldtype' => 'Link'],
                ['fieldname' => 'debit', 'label' => 'Debit', 'fieldtype' => 'Currency'],
                ['fieldname' => 'credit', 'label' => 'Credit', 'fieldtype' => 'Currency'],
                ['fieldname' => 'balance', 'label' => 'Balance', 'fieldtype' => 'Currency'],
                ['fieldname' => 'voucher_type', 'label' => 'Voucher Type', 'fieldtype' => 'Data'],
                ['fieldname' => 'voucher_no', 'label' => 'Voucher No', 'fieldtype' => 'Link'],
                ['fieldname' => 'party', 'label' => 'Party', 'fieldtype' => 'Link'],
            ],
            'Accounts Receivable' => [
                ['fieldname' => 'posting_date', 'label' => 'Posting Date', 'fieldtype' => 'Date'],
                ['fieldname' => 'customer', 'label' => 'Customer', 'fieldtype' => 'Link'],
                ['fieldname' => 'customer_name', 'label' => 'Customer Name', 'fieldtype' => 'Data'],
                ['fieldname' => 'voucher_type', 'label' => 'Voucher Type', 'fieldtype' => 'Data'],
                ['fieldname' => 'voucher_no', 'label' => 'Voucher No', 'fieldtype' => 'Link'],
                ['fieldname' => 'invoiced_amount', 'label' => 'Invoiced Amount', 'fieldtype' => 'Currency'],
                ['fieldname' => 'paid_amount', 'label' => 'Paid Amount', 'fieldtype' => 'Currency'],
                ['fieldname' => 'outstanding_amount', 'label' => 'Outstanding Amount', 'fieldtype' => 'Currency'],
                ['fieldname' => 'age', 'label' => 'Age (Days)', 'fieldtype' => 'Int'],
            ],
            'Sales Register' => [
                ['fieldname' => 'posting_date', 'label' => 'Posting Date', 'fieldtype' => 'Date'],
                ['fieldname' => 'customer', 'label' => 'Customer', 'fieldtype' => 'Link'],
                ['fieldname' => 'customer_name', 'label' => 'Customer Name', 'fieldtype' => 'Data'],
                ['fieldname' => 'item_code', 'label' => 'Item Code', 'fieldtype' => 'Link'],
                ['fieldname' => 'item_name', 'label' => 'Item Name', 'fieldtype' => 'Data'],
                ['fieldname' => 'qty', 'label' => 'Quantity', 'fieldtype' => 'Float'],
                ['fieldname' => 'rate', 'label' => 'Rate', 'fieldtype' => 'Currency'],
                ['fieldname' => 'amount', 'label' => 'Amount', 'fieldtype' => 'Currency'],
            ],
        ];

        // Default columns if report not found
        $columns = $reportColumns[$reportName] ?? [
            ['fieldname' => 'name', 'label' => 'ID', 'fieldtype' => 'Data'],
            ['fieldname' => 'posting_date', 'label' => 'Date', 'fieldtype' => 'Date'],
            ['fieldname' => 'grand_total', 'label' => 'Grand Total', 'fieldtype' => 'Currency'],
            ['fieldname' => 'status', 'label' => 'Status', 'fieldtype' => 'Data'],
        ];

        return response()->json([
            'success' => true,
            'columns' => $columns,
            'source' => 'demo',
            'debug_error' => $debugError
        ]);
    }

    /**
     * Get report data with filters
     */
    public function getReportData(Request $request)
    {
        $reportName = $request->query('report');
        $fromDate = $request->query('from_date');
        $toDate = $request->query('to_date');
        $company = $request->query('company');

        // Build filters for ERPNext report
        $filters = [];
        if ($fromDate) {
            $filters['from_date'] = $fromDate;
        }
        if ($toDate) {
            $filters['to_date'] = $toDate;
        }
        if ($company) {
            $filters['company'] = $company;
        }

        // Try to fetch from ERP
        try {
            // Check if ERP is configured
            if ($this->erpService->isConfigured()) {
                $reportData = $this->erpService->getReportData($reportName, $filters);
                
                if ($reportData) {
                    // ERPNext returns columns and result
                    $columns = [];
                    foreach ($reportData['columns'] ?? [] as $col) {
                        if (is_array($col)) {
                            $columns[] = [
                                'fieldname' => $col['fieldname'] ?? $col['field_name'] ?? '',
                                'label' => $col['label'] ?? $col['fieldname'] ?? '',
                                'fieldtype' => $col['fieldtype'] ?? 'Data',
                            ];
                        } else if (is_string($col)) {
                            // Sometimes columns are strings like "date:Date:120"
                            $parts = explode(':', $col);
                            $columns[] = [
                                'fieldname' => $parts[0] ?? $col,
                                'label' => ucfirst(str_replace('_', ' ', $parts[0] ?? $col)),
                                'fieldtype' => $parts[1] ?? 'Data',
                            ];
                        }
                    }

                    // Transform result data
                    $data = [];
                    foreach ($reportData['result'] ?? [] as $row) {
                        if (is_array($row) && !isset($row['indent'])) {
                            // Skip summary/total rows (they often have indent property)
                            $rowData = [];
                            if (isset($row[0])) {
                                // Array-indexed row - map to column fieldnames
                                foreach ($columns as $idx => $col) {
                                    $rowData[$col['fieldname']] = $row[$idx] ?? null;
                                }
                            } else {
                                // Associative array row
                                $rowData = $row;
                            }
                            $data[] = $rowData;
                        }
                    }

                    return response()->json([
                        'success' => true,
                        'columns' => $columns,
                        'data' => $data,
                        'source' => 'erpnext'
                    ]);
                }
            }

            // Fallback to demo data if ERP not configured or failed
            Log::info('Using demo data for report: ' . $reportName);
            $columns = $this->getReportColumns($request)->original['columns'];
            
            // Sample data
            $data = [
                [
                    'posting_date' => '2026-01-15',
                    'customer' => 'CUST-001',
                    'customer_name' => 'John Doe',
                    'mode_of_payment' => 'Cash',
                    'paid_amount' => 15000.00,
                    'outstanding_amount' => 0,
                    'voucher_type' => 'Sales Invoice',
                    'voucher_no' => 'SINV-00001',
                    'item_code' => 'ITEM-001',
                    'item_name' => 'Product A',
                    'qty' => 10,
                    'rate' => 1500,
                    'amount' => 15000,
                    'grand_total' => 15000,
                    'status' => 'Paid',
                ],
                [
                    'posting_date' => '2026-01-18',
                    'customer' => 'CUST-002',
                    'customer_name' => 'Jane Smith',
                    'mode_of_payment' => 'Bank Transfer',
                    'paid_amount' => 22500.50,
                    'outstanding_amount' => 5000,
                    'voucher_type' => 'Sales Invoice',
                    'voucher_no' => 'SINV-00002',
                    'item_code' => 'ITEM-002',
                    'item_name' => 'Product B',
                    'qty' => 5,
                    'rate' => 4500.10,
                    'amount' => 22500.50,
                    'grand_total' => 22500.50,
                    'status' => 'Partially Paid',
                ],
                [
                    'posting_date' => '2026-01-20',
                    'customer' => 'CUST-003',
                    'customer_name' => 'Acme Corp',
                    'mode_of_payment' => 'Credit',
                    'paid_amount' => 0,
                    'outstanding_amount' => 75000,
                    'voucher_type' => 'Sales Invoice',
                    'voucher_no' => 'SINV-00003',
                    'item_code' => 'ITEM-003',
                    'item_name' => 'Product C',
                    'qty' => 50,
                    'rate' => 1500,
                    'amount' => 75000,
                    'grand_total' => 75000,
                    'status' => 'Unpaid',
                ],
            ];

            return response()->json([
                'success' => true,
                'columns' => $columns,
                'data' => $data,
                'source' => 'demo'
            ]);
        } catch (\Exception $e) {
            Log::error('getReportData error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch report data: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get companies from ERP
     */
    public function getCompanies()
    {
        try {
            if ($this->erpService->isConfigured()) {
                $erpCompanies = $this->erpService->getCompanies();
                
                if (!empty($erpCompanies)) {
                    $companies = array_map(function($c) {
                        return [
                            'name' => $c['name'] ?? '',
                            'company_name' => $c['company_name'] ?? $c['name'] ?? '',
                        ];
                    }, $erpCompanies);

                    return response()->json([
                        'success' => true,
                        'companies' => $companies,
                        'source' => 'erpnext'
                    ]);
                }
            }

            // Fallback demo data
            $companies = [
                ['name' => 'Demo Company', 'company_name' => 'Demo Company Ltd.'],
                ['name' => 'Test Corp', 'company_name' => 'Test Corporation Inc.'],
            ];

            return response()->json([
                'success' => true,
                'companies' => $companies,
                'source' => 'demo'
            ]);
        } catch (\Exception $e) {
            Log::error('getCompanies error: ' . $e->getMessage());
            return response()->json([
                'success' => true,
                'companies' => [
                    ['name' => 'Demo Company', 'company_name' => 'Demo Company Ltd.'],
                ],
                'source' => 'demo'
            ]);
        }
    }

    /**
     * Get saved ERP templates
     */
    public function getTemplates(Request $request)
    {
        $reportFilter = $request->query('report');
        
        $query = PdfTemplate::where(function($q) {
            $q->whereNotNull('doctype')
              ->orWhereNotNull('source_table');
        });
        
        // Filter by report type if specified
        if ($reportFilter) {
            $query->where(function($q) use ($reportFilter) {
                $q->where('doctype', $reportFilter)
                  ->orWhere('source_table', $reportFilter);
            });
        }
        
        $templates = $query->get()->map(function ($t) {
            return [
                'id' => (string)$t->id,
                'name' => $t->name ?? $t->key,
                'report' => $t->doctype ?? $t->source_table ?? 'General',
                'fields' => $t->fields_config ?? [],
                'createdAt' => $t->created_at ? $t->created_at->toISOString() : now()->toISOString(),
            ];
        });

        return response()->json([
            'success' => true,
            'templates' => $templates
        ]);
    }

    /**
     * Save a new ERP template
     */
    public function saveTemplate(Request $request)
    {
        try {
            $name = $request->input('name');
            $report = $request->input('report');
            $fields = json_decode($request->input('fields', '[]'), true);
            $canvasWidth = $request->input('canvasWidth');
            $canvasHeight = $request->input('canvasHeight');
            $scale = $request->input('scale', 1.5);

            $key = strtolower(preg_replace('/[^a-zA-Z0-9]+/', '_', $name));

            // Handle PDF upload
            $filePath = null;
            if ($request->hasFile('pdf')) {
                $file = $request->file('pdf');
                $filePath = $file->storeAs('pdf_templates', $key . '.pdf', 'public');
            }

            // Convert canvas coordinates to PDF coordinates
            $fieldsConfig = [];
            foreach ($fields as $field) {
                $fieldname = $field['fieldname'];
                
                // Calculate PDF coordinates (approximate conversion from canvas)
                $x = ($field['x'] / ($scale * 2.83)); // pixels to mm
                $y = ($field['y'] / ($scale * 2.83));
                
                $width = isset($field['width']) && $field['width'] > 0 
                    ? ($field['width'] / ($scale * 2.83)) 
                    : 0;

                $fieldsConfig[$fieldname] = [
                    'x' => round($x, 2),
                    'y' => round($y, 2),
                    'width' => round($width, 2),
                    'wrap_text' => $field['wrapText'] ?? false,
                    'page' => $field['page'] ?? 1,
                    'font' => 'Arial',
                    'size' => 12,
                    'label' => $field['label'] ?? $fieldname,
                ];
            }

            $template = PdfTemplate::updateOrCreate(
                ['key' => $key],
                [
                    'name' => $name,
                    'doctype' => $report,
                    'fields_config' => $fieldsConfig,
                    'file_path' => $filePath,
                ]
            );

            return response()->json([
                'success' => true,
                'template' => $template,
                'message' => 'Template saved successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Save ERP template error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => 'Failed to save template: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Decompress PDF using Ghostscript for FPDI compatibility
     */
    private function decompressPdf($inputPath)
    {
        $outputPath = storage_path('app/temp/' . uniqid('decompressed_') . '.pdf');
        
        // Ensure temp directory exists
        if (!is_dir(storage_path('app/temp'))) {
            mkdir(storage_path('app/temp'), 0755, true);
        }
        
        // Try Windows Ghostscript first, then Linux/Mac
        $gsCommands = [
            'gswin64c -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dNOPAUSE -dQUIET -dBATCH -sOutputFile="' . $outputPath . '" "' . $inputPath . '"',
            'gswin32c -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dNOPAUSE -dQUIET -dBATCH -sOutputFile="' . $outputPath . '" "' . $inputPath . '"',
            'gs -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dNOPAUSE -dQUIET -dBATCH -sOutputFile="' . $outputPath . '" "' . $inputPath . '"',
        ];
        
        foreach ($gsCommands as $gsCommand) {
            exec($gsCommand . ' 2>&1', $output, $returnCode);
            
            if ($returnCode === 0 && file_exists($outputPath)) {
                Log::info('PDF decompressed successfully using Ghostscript');
                return $outputPath;
            }
        }
        
        // Ghostscript not available, return null
        Log::info('Ghostscript not available for PDF decompression');
        return null;
    }

    /**
     * Generate a single PDF from report data
     */
    public function generateSinglePdf(Request $request)
    {
        $decompressedPath = null;
        
        try {
            $templateId = $request->input('templateId');
            $data = $request->input('data', []);
            $preview = $request->input('preview', false);

            if (empty($data)) {
                return response()->json(['error' => 'No data provided'], 400);
            }

            $template = PdfTemplate::find($templateId);
            if (!$template) {
                $template = PdfTemplate::where('key', $templateId)->first();
            }

            if (!$template || !$template->file_path) {
                // Generate a simple PDF without template
                return $this->generateSimplePdf($data[0] ?? [], $preview);
            }

            $pdfPath = storage_path('app/public/' . $template->file_path);
            if (!file_exists($pdfPath)) {
                return $this->generateSimplePdf($data[0] ?? [], $preview);
            }

            $fieldsConfig = $template->fields_config ?? [];
            $row = $data[0] ?? [];

            // Try to decompress PDF first for FPDI compatibility
            $decompressedPath = $this->decompressPdf($pdfPath);
            $workingPdfPath = $decompressedPath ?? $pdfPath;

            $pdf = new Fpdi();
            
            try {
                $pageCount = $pdf->setSourceFile($workingPdfPath);
            } catch (\Exception $e) {
                // If FPDI still fails, generate simple PDF
                Log::warning('FPDI failed, generating simple PDF: ' . $e->getMessage());
                if ($decompressedPath && file_exists($decompressedPath)) {
                    @unlink($decompressedPath);
                }
                return $this->generateSimplePdf($row, $preview);
            }

            for ($pageNo = 1; $pageNo <= $pageCount; $pageNo++) {
                $tplId = $pdf->importPage($pageNo);
                $size = $pdf->getTemplateSize($tplId);
                $pdf->AddPage($size['orientation'], [$size['width'], $size['height']]);
                $pdf->useTemplate($tplId, 0, 0, $size['width'], $size['height']);
                $pdf->SetFont('Arial', '', 12);

                foreach ($fieldsConfig as $fieldKey => $config) {
                    $fieldPage = $config['page'] ?? 1;
                    if ($fieldPage != $pageNo) continue;

                    $baseField = preg_replace('/_\d+$/', '', $fieldKey);
                    $value = $row[$baseField] ?? $row[$fieldKey] ?? '';
                    
                    if (empty($value)) continue;

                    $x = $config['x'] ?? 10;
                    $y = $config['y'] ?? 10;
                    $fontSize = $config['size'] ?? 12;
                    // Width is stored in pixels, convert to mm (approximately 3.78 pixels per mm at 96 DPI)
                    $widthPx = $config['width'] ?? 0;
                    $width = $widthPx > 0 ? $widthPx / 3.78 : 0;
                    $wrapText = $config['wrap_text'] ?? false;
                    // Get alignment (default to 'left')
                    $align = $config['align'] ?? 'left';

                    $pdf->SetFontSize($fontSize);
                    
                    // Calculate X position based on alignment
                    $startX = $x;
                    if ($width > 0) {
                        if ($align === 'center') {
                            $startX = $x - ($width / 2);
                        } elseif ($align === 'right') {
                            $startX = $x - $width;
                        }
                        $startX = max(0, $startX);
                    }
                    
                    // Map alignment to FPDF alignment codes
                    $fpdfAlign = 'L';
                    if ($align === 'center') {
                        $fpdfAlign = 'C';
                    } elseif ($align === 'right') {
                        $fpdfAlign = 'R';
                    }
                    
                    if ($wrapText && $width > 0) {
                        $pdf->SetXY($startX, $y);
                        $lineHeight = $fontSize * 0.4;
                        $pdf->MultiCell($width, $lineHeight, (string)$value, 0, $fpdfAlign);
                    } else if ($width > 0) {
                        $pdf->SetXY($startX, $y);
                        $pdf->Cell($width, $fontSize / 2, (string)$value, 0, 0, $fpdfAlign);
                    } else {
                        $pdf->SetXY($x, $y);
                        $pdf->Write(0, (string)$value);
                    }
                }
            }

            $pdfContent = $pdf->Output('S');
            $filename = 'document_' . time() . '.pdf';

            // Cleanup decompressed file
            if ($decompressedPath && file_exists($decompressedPath)) {
                @unlink($decompressedPath);
            }

            return response($pdfContent)
                ->header('Content-Type', 'application/pdf')
                ->header('Content-Disposition', ($preview ? 'inline' : 'attachment') . '; filename="' . $filename . '"');

        } catch (\Exception $e) {
            // Cleanup decompressed file on error
            if ($decompressedPath && file_exists($decompressedPath)) {
                @unlink($decompressedPath);
            }
            
            Log::error('Generate single PDF error: ' . $e->getMessage());
            
            // Fallback to simple PDF
            $row = $request->input('data', [[]])[0] ?? [];
            return $this->generateSimplePdf($row, $request->input('preview', false));
        }
    }

    /**
     * Generate a simple PDF without template (fallback)
     */
    private function generateSimplePdf(array $data, bool $preview = false)
    {
        Log::info('generateSimplePdf called with data:', ['data' => $data, 'preview' => $preview]);
        
        $pdf = new \FPDF();
        $pdf->AddPage();
        $pdf->SetFont('Arial', 'B', 16);
        $pdf->Cell(0, 10, 'ERP Report Data', 0, 1, 'C');
        $pdf->Ln(5);
        
        // Add a separator line
        $pdf->SetDrawColor(200, 200, 200);
        $pdf->Line(10, $pdf->GetY(), 200, $pdf->GetY());
        $pdf->Ln(10);
        
        $pdf->SetFont('Arial', '', 11);
        
        if (empty($data)) {
            $pdf->Cell(0, 10, 'No data provided', 0, 1, 'C');
        } else {
            foreach ($data as $key => $value) {
                if ($value !== null && $value !== '' && !is_array($value)) {
                    $label = ucfirst(str_replace('_', ' ', (string)$key));
                    
                    // Format the value
                    if (is_numeric($value)) {
                        $displayValue = number_format((float)$value, 2);
                    } else {
                        $displayValue = (string)$value;
                    }
                    
                    // Bold label
                    $pdf->SetFont('Arial', 'B', 11);
                    $pdf->Cell(60, 8, $label . ':', 0, 0);
                    
                    // Normal value
                    $pdf->SetFont('Arial', '', 11);
                    $pdf->Cell(0, 8, $displayValue, 0, 1);
                }
            }
        }
        
        // Add footer
        $pdf->Ln(10);
        $pdf->SetFont('Arial', 'I', 9);
        $pdf->SetTextColor(128, 128, 128);
        $pdf->Cell(0, 10, 'Generated on ' . date('Y-m-d H:i:s'), 0, 1, 'C');
        
        $pdfContent = $pdf->Output('S');
        $filename = 'report_' . date('Ymd_His') . '.pdf';
        
        return response($pdfContent)
            ->header('Content-Type', 'application/pdf')
            ->header('Content-Disposition', ($preview ? 'inline' : 'attachment') . '; filename="' . $filename . '"');
    }
}
