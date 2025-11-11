<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserPreference extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'email_notifications_enabled',
        'push_notifications_enabled',
        'preferred_language',
        'do_not_disturb_times',
    ];

    /**
     * Cast do_not_disturb_times as array for easy access.
     * Laravel automatically handles JSON to array conversion.
     */
    protected $casts = [
        'do_not_disturb_times' => 'array',
        'email_notifications_enabled' => 'boolean',
        'push_notifications_enabled' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
