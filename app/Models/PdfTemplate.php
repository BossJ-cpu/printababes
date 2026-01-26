<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class PdfTemplate extends Model
{
    protected $fillable = ['key', 'name', 'fields_config', 'file_path', 'source_table', 'pdf_path', 'elements', 'data_source_type', 'doctype'];

    protected $casts = [
        'fields_config' => 'array',
        'elements' => 'array',
    ];

    public function dataImport()
    {
        return $this->hasOne(DataImport::class);
    }

    // Get all tables except pdf_templates and Laravel system tables
    public static function getAvailableTables()
    {
        $tables = DB::select('SELECT name FROM sqlite_master WHERE type="table"');
        
        // Laravel system tables to exclude
        $systemTables = [
            'migrations',
            'pdf_templates',
            'users',
            'password_reset_tokens',
            'sessions',
            'cache',
            'cache_locks',
            'jobs',
            'job_batches',
            'failed_jobs',
            'personal_access_tokens',
            'submissions',
            'sqlite_sequence'
        ];
        
        $availableTables = [];
        foreach ($tables as $table) {
            $tableName = $table->name;
            if (!in_array($tableName, $systemTables)) {
                $availableTables[] = $tableName;
            }
        }
        return $availableTables;
    }

    // Get columns for a specific table (by position)
    public function getTableColumns()
    {
        if (!$this->source_table) {
            return [];
        }
        return Schema::getColumnListing($this->source_table);
    }

    // Fill PDF with data based on field numbers
    public function fillPdfData($recordId)
    {
        if (!$this->source_table) {
            return [];
        }
        $columns = $this->getTableColumns();
        $record = DB::table($this->source_table)->find($recordId);
        if (!$record) {
            return [];
        }
        $data = [];
        foreach ($this->fields_config as $field) {
            // field['name'] is like "1", "2", "3"
            $fieldNumber = (int)$field['name'];
            $columnIndex = $fieldNumber - 1; // Convert to 0-based index
            if (isset($columns[$columnIndex])) {
                $columnName = $columns[$columnIndex];
                $data[$field['name']] = $record->$columnName ?? '';
            }
        }
        return $data;
    }
}
