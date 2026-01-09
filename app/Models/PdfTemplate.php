<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PdfTemplate extends Model
{
    protected $fillable = ['key', 'name', 'fields_config', 'file_path'];

    protected $casts = [
        'fields_config' => 'array',
    ];
}
