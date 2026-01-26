<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ErpService
{
    protected $baseUrl;
    protected $key;
    protected $secret;

    public function __construct()
    {
        $this->baseUrl = config('services.erp.base_url');
        $this->key = config('services.erp.key');
        $this->secret = config('services.erp.secret');
    }

    /**
     * Get the configured HTTP client with Auth headers
     */
    protected function getClient()
    {
        // "restful next" implies ERPNext or similar that uses token auth
        // Header format for ERPNext: Authorization: token api_key:api_secret
        return Http::baseUrl($this->baseUrl)
                   ->withHeaders([
                       'Authorization' => 'token ' . $this->key . ':' . $this->secret,
                       'Accept' => 'application/json',
                       'Content-Type' => 'application/json',
                   ])
                   ->withoutVerifying(); // Disable SSL verification for local/dev ERP
    }

    /**
     * Send a Submission to ERP
     * You may need to adjust the endpoint '/resource/Customer' or '/resource/Lead'
     * based on your specific ERP DocType.
     */
    public function createGenericRecord($docType, $data)
    {
        if (!$this->baseUrl || !$this->key) {
            Log::warning('ERP Sync Skipped: Missing Configuration');
            return null;
        }

        $endpoint = "/resource/{$docType}";
        
        try {
            Log::info("ERP API Request", [
                'url' => $this->baseUrl . $endpoint,
                'data' => $data
            ]);
            
            $response = $this->getClient()->post($endpoint, ['data' => $data]);
            
            Log::info("ERP API Response", [
                'status' => $response->status(),
                'body' => $response->body()
            ]);
            
            if ($response->successful()) {
                Log::info("ERP Record Created Successfully", [
                    'doctype' => $docType,
                    'response' => $response->json()
                ]);
                return $response->json();
            } else {
                Log::error("ERP API Error", [
                    'doctype' => $docType,
                    'status' => $response->status(),
                    'body' => $response->body()
                ]);
                return null;
            }
        } catch (\Exception $e) {
            Log::error("ERP Sync Exception: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Get list of records from a DocType
     */
    public function getRecords(string $docType, array $filters = [], int $limit = 100): array
    {
        if (!$this->baseUrl || !$this->key) {
            Log::warning('ERP getRecords Skipped: Missing Configuration');
            return [];
        }

        $endpoint = "/resource/{$docType}";
        
        try {
            $queryParams = [
                'limit_page_length' => $limit,
                'fields' => '["*"]'
            ];
            
            if (!empty($filters)) {
                $queryParams['filters'] = json_encode($filters);
            }

            Log::info("ERP API GET Request", [
                'url' => $this->baseUrl . $endpoint,
                'params' => $queryParams
            ]);
            
            $response = $this->getClient()->get($endpoint, $queryParams);
            
            if ($response->successful()) {
                $data = $response->json();
                Log::info("ERP Records Retrieved", [
                    'doctype' => $docType,
                    'count' => count($data['data'] ?? [])
                ]);
                return $data['data'] ?? [];
            } else {
                Log::error("ERP API Error getting records", [
                    'doctype' => $docType,
                    'status' => $response->status(),
                    'body' => $response->body()
                ]);
                return [];
            }
        } catch (\Exception $e) {
            Log::error("ERP getRecords Exception: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Get a single record by name
     */
    public function getRecord(string $docType, string $name): ?array
    {
        if (!$this->baseUrl || !$this->key) {
            Log::warning('ERP getRecord Skipped: Missing Configuration');
            return null;
        }

        $endpoint = "/resource/{$docType}/{$name}";
        
        try {
            Log::info("ERP API GET Single Record", [
                'url' => $this->baseUrl . $endpoint
            ]);
            
            $response = $this->getClient()->get($endpoint);
            
            if ($response->successful()) {
                $data = $response->json();
                Log::info("ERP Record Retrieved", [
                    'doctype' => $docType,
                    'name' => $name
                ]);
                return $data['data'] ?? null;
            } else {
                Log::error("ERP API Error getting record", [
                    'doctype' => $docType,
                    'name' => $name,
                    'status' => $response->status(),
                    'body' => $response->body()
                ]);
                return null;
            }
        } catch (\Exception $e) {
            Log::error("ERP getRecord Exception: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Run a report and get its data
     */
    public function getReportData(string $reportName, array $filters = []): ?array
    {
        if (!$this->baseUrl || !$this->key) {
            Log::warning('ERP getReportData Skipped: Missing Configuration');
            return null;
        }

        // ERPNext report API endpoint - note: baseUrl already has /api
        $endpoint = "/method/frappe.desk.query_report.run";
        
        try {
            $params = [
                'report_name' => $reportName,
                'filters' => json_encode($filters),
            ];

            Log::info("ERP Report Request", [
                'url' => $this->baseUrl . $endpoint,
                'report' => $reportName,
                'filters' => $filters
            ]);
            
            $response = $this->getClient()->get($endpoint, $params);
            
            if ($response->successful()) {
                $data = $response->json();
                Log::info("ERP Report Retrieved", [
                    'report' => $reportName,
                    'rows' => count($data['message']['result'] ?? [])
                ]);
                return $data['message'] ?? null;
            } else {
                Log::error("ERP Report Error", [
                    'report' => $reportName,
                    'status' => $response->status(),
                    'body' => $response->body()
                ]);
                return null;
            }
        } catch (\Exception $e) {
            Log::error("ERP getReportData Exception: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Get companies from ERPNext
     */
    public function getCompanies(): array
    {
        return $this->getRecords('Company', [], 100);
    }

    /**
     * Check if ERP is configured
     */
    public function isConfigured(): bool
    {
        return !empty($this->baseUrl) && !empty($this->key);
    }
}
