<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Submission extends Model
{
    use HasFactory;

    protected $fillable = ['quiz_id', 'user_id', 'answers', 'manual_grades', 'score', 'earned_points', 'total_points', 'submitted_at'];

    protected function casts(): array
    {
        return [
            'answers' => 'array',
            'manual_grades' => 'array',
            'score' => 'decimal:2',
            'earned_points' => 'decimal:2',
            'total_points' => 'decimal:2',
            'submitted_at' => 'datetime',
        ];
    }

    public function quiz(): BelongsTo
    {
        return $this->belongsTo(Quiz::class);
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function examLogs(): HasMany
    {
        return $this->hasMany(ExamLog::class);
    }
}
