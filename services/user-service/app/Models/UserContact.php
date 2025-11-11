<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserContact extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'email',
        'push_token',
        'phone',
    ];

    /**
     * Define relationship: This contact belongs to a user.
     * Allows $contact->user to fetch the owner.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
