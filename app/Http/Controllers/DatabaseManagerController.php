<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class DatabaseManagerController extends Controller
{
    // Get all tables with metadata
    public function getTables()
    {
        $tables = DB::select("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
        
        $tableData = [];
        foreach ($tables as $table) {
            $tableName = $table->name;
            $columns = Schema::getColumnListing($tableName);
            $rowCount = DB::table($tableName)->count();
            
            $tableData[] = [
                'name' => $tableName,
                'columns' => $columns,
                'column_count' => count($columns),
                'row_count' => $rowCount
            ];
        }
        
        return response()->json(['success' => true, 'data' => $tableData]);
    }
    
    // Get table schema and data
    public function getTableData($tableName)
    {
        if (!Schema::hasTable($tableName)) {
            return response()->json(['success' => false, 'message' => 'Table not found'], 404);
        }
        
        $columns = Schema::getColumnListing($tableName);
        $data = DB::table($tableName)->get();
        
        return response()->json([
            'success' => true,
            'data' => [
                'columns' => $columns,
                'data' => $data
            ]
        ]);
    }
    
    // Create new table
    public function createTable(Request $request)
    {
        $validated = $request->validate([
            'table_name' => 'required|string|regex:/^[a-z_]+$/',
            'columns' => 'required|array|min:1',
            'columns.*.name' => 'required|string|regex:/^[a-z_]+$/',
            'columns.*.type' => 'required|in:string,text,integer,decimal,boolean,date,datetime',
            'columns.*.nullable' => 'boolean',
            'columns.*.default' => 'nullable|string'
        ]);
        
        $tableName = $validated['table_name'];
        
        if (Schema::hasTable($tableName)) {
            return response()->json(['success' => false, 'message' => 'Table already exists'], 400);
        }
        
        Schema::create($tableName, function ($table) use ($validated) {
            $table->id();
            
            foreach ($validated['columns'] as $column) {
                $col = null;
                switch ($column['type']) {
                    case 'string':
                        $col = $table->string($column['name']);
                        break;
                    case 'text':
                        $col = $table->text($column['name']);
                        break;
                    case 'integer':
                        $col = $table->integer($column['name']);
                        break;
                    case 'decimal':
                        $col = $table->decimal($column['name'], 10, 2);
                        break;
                    case 'boolean':
                        $col = $table->boolean($column['name']);
                        break;
                    case 'date':
                        $col = $table->date($column['name']);
                        break;
                    case 'datetime':
                        $col = $table->dateTime($column['name']);
                        break;
                }
                
                if (isset($column['nullable']) && $column['nullable']) {
                    $col->nullable();
                }
                
                if (isset($column['default']) && $column['default'] !== null) {
                    $col->default($column['default']);
                }
            }
            
            $table->timestamps();
        });
        
        return response()->json(['success' => true, 'message' => 'Table created successfully', 'data' => ['table' => $tableName]]);
    }
    
    // Add column to existing table
    public function addColumn(Request $request, $tableName)
    {
        if (!Schema::hasTable($tableName)) {
            return response()->json(['success' => false, 'message' => 'Table not found'], 404);
        }
        
        $validated = $request->validate([
            'name' => 'required|string|regex:/^[a-z_]+$/',
            'type' => 'required|in:string,text,integer,decimal,boolean,date,datetime',
            'nullable' => 'boolean',
            'default' => 'nullable|string'
        ]);
        
        if (Schema::hasColumn($tableName, $validated['name'])) {
            return response()->json(['success' => false, 'message' => 'Column already exists'], 400);
        }
        
        Schema::table($tableName, function ($table) use ($validated) {
            $col = null;
            switch ($validated['type']) {
                case 'string':
                    $col = $table->string($validated['name']);
                    break;
                case 'text':
                    $col = $table->text($validated['name']);
                    break;
                case 'integer':
                    $col = $table->integer($validated['name']);
                    break;
                case 'decimal':
                    $col = $table->decimal($validated['name'], 10, 2);
                    break;
                case 'boolean':
                    $col = $table->boolean($validated['name']);
                    break;
                case 'date':
                    $col = $table->date($validated['name']);
                    break;
                case 'datetime':
                    $col = $table->dateTime($validated['name']);
                    break;
            }
            
            if (isset($validated['nullable']) && $validated['nullable']) {
                $col->nullable();
            }
            
            if (isset($validated['default']) && $validated['default'] !== null) {
                $col->default($validated['default']);
            }
        });
        
        return response()->json(['success' => true, 'message' => 'Column added successfully']);
    }
    
    // Delete table
    public function deleteTable($tableName)
    {
        $protected = ['users', 'migrations', 'pdf_templates', 'submissions', 'personal_access_tokens', 'cache', 'cache_locks', 'jobs', 'job_batches', 'failed_jobs', 'password_reset_tokens', 'sessions'];
        
        if (in_array($tableName, $protected)) {
            return response()->json(['success' => false, 'message' => 'Cannot delete protected table'], 403);
        }
        
        if (!Schema::hasTable($tableName)) {
            return response()->json(['success' => false, 'message' => 'Table not found'], 404);
        }
        
        Schema::dropIfExists($tableName);
        
        return response()->json(['success' => true, 'message' => 'Table deleted successfully']);
    }
    
    // Insert row
    public function insertRow(Request $request, $tableName)
    {
        if (!Schema::hasTable($tableName)) {
            return response()->json(['success' => false, 'message' => 'Table not found'], 404);
        }
        
        $data = $request->except(['_token']);
        
        $id = DB::table($tableName)->insertGetId($data);
        
        return response()->json(['success' => true, 'message' => 'Row inserted successfully', 'data' => ['id' => $id]]);
    }
    
    // Update row
    public function updateRow(Request $request, $tableName, $id)
    {
        if (!Schema::hasTable($tableName)) {
            return response()->json(['success' => false, 'message' => 'Table not found'], 404);
        }
        
        $data = $request->except(['_token', 'id']);
        
        DB::table($tableName)->where('id', $id)->update($data);
        
        return response()->json(['success' => true, 'message' => 'Row updated successfully']);
    }
    
    // Delete row
    public function deleteRow($tableName, $id)
    {
        if (!Schema::hasTable($tableName)) {
            return response()->json(['success' => false, 'message' => 'Table not found'], 404);
        }
        
        DB::table($tableName)->where('id', $id)->delete();
        
        return response()->json(['success' => true, 'message' => 'Row deleted successfully']);
    }
}
