<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DataImport extends Model
{
    protected $fillable = [
        'pdf_template_id',
        'filename',
        'file_path',
        'columns',
        'total_rows'
    ];

    protected $casts = [
        'columns' => 'array'
    ];

    public function pdfTemplate()
    {
        return $this->belongsTo(PdfTemplate::class);
    }
}
