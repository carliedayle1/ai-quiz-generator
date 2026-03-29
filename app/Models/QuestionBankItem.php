<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class QuestionBankItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'type',
        'content',
        'points',
        'subject',
        'difficulty',
    ];

    protected $casts = [
        'content' => 'array',
        'points' => 'integer',
    ];

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
