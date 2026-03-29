<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Quiz extends Model
{
    use HasFactory;

    protected $fillable = [
        'class_id', 'title', 'description', 'time_limit', 'is_published',
        'available_from', 'available_until', 'due_date', 'status', 'allow_partial_credit',
        'is_public',
    ];

    protected function casts(): array
    {
        return [
            'is_published' => 'boolean',
            'allow_partial_credit' => 'boolean',
            'is_public' => 'boolean',
            'time_limit' => 'integer',
            'available_from' => 'datetime',
            'available_until' => 'datetime',
            'due_date' => 'datetime',
        ];
    }

    // Backward-compat accessor — reads from status field
    public function getIsPublishedAttribute(): bool
    {
        return $this->status === 'published';
    }

    public function isAvailable(): bool
    {
        if ($this->status !== 'published' && $this->status !== 'scheduled') {
            return false;
        }
        $now = now();
        if ($this->available_from && $now->lt($this->available_from)) {
            return false;
        }
        if ($this->available_until && $now->gt($this->available_until)) {
            return false;
        }
        return $this->status === 'published';
    }

    public function scopePublished($query)
    {
        return $query->where('status', 'published');
    }

    public function scopePublic($query)
    {
        return $query->where('is_public', true);
    }

    public function classModel(): BelongsTo
    {
        return $this->belongsTo(ClassModel::class, 'class_id');
    }

    public function questions(): HasMany
    {
        return $this->hasMany(Question::class)->orderBy('order');
    }

    public function submissions(): HasMany
    {
        return $this->hasMany(Submission::class);
    }

    public function totalPoints(): int
    {
        return $this->questions()->sum('points');
    }
}
