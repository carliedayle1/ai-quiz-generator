<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Question extends Model
{
    use HasFactory;

    protected $fillable = ['quiz_id', 'type', 'content', 'points', 'order'];

    public function isSectionHeader(): bool
    {
        return $this->type === 'section_header';
    }

    protected function casts(): array
    {
        return [
            'content' => 'array',
            'points' => 'integer',
            'order' => 'integer',
        ];
    }

    public function quiz(): BelongsTo
    {
        return $this->belongsTo(Quiz::class);
    }
}
