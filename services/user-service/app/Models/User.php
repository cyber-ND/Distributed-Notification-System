<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Spatie\Permission\Traits\HasRoles; // Spatie roles & permissions
use Illuminate\Support\Facades\Hash; // For secure password hashing
use Laravel\Sanctum\HasApiTokens; // For API token management

/**
 * User Model for the User Service microservice.
 *
 * This model represents a user in the distributed notification system.
 * It includes:
 * - Basic auth (username/email + password)
 * - Spatie roles/permissions (e.g., admin, user)
 * - Relationships to contacts and preferences
 * - Automatic password hashing
 * - No email verification or remember_token (not needed in API-only service)
 */
class User extends Authenticatable
{
    /** Enables factory for seeding/testing */
    use HasFactory, HasRoles, HasApiTokens; // HASAPITOKENS ADDED HERE

    /**
     * The attributes that are mass assignable.
     * These fields can be filled via User::create() or $user->fill().
     *
     * @var array<string>
     */
    protected $fillable = [
        'username',
        'email',
        'password',
    ];

    /**
     * The attributes that should be hidden when converting to array/JSON.
     * Prevents leaking sensitive data in API responses.
     *
     * @var array<string>
     */
    protected $hidden = [
        'password',
    ];

    /**
     * Automatically hash password when set.
     * Called whenever $user->password = 'plain' is assigned.
     * Uses Laravel's secure bcrypt hashing.
     */
    public function setPasswordAttribute($value)
    {
        $this->attributes['password'] = Hash::make($value);
    }

    /**
     * Relationship: A user has many contact entries.
     * Used to store multiple emails, push tokens, etc.
     *
     * @return HasMany
     */
    public function contacts(): HasMany
    {
        return $this->hasMany(UserContact::class);
    }

    /**
     * Relationship: A user has one preference record.
     * Stores notification settings like language, enabled channels.
     *
     * @return HasOne
     */
    public function preferences(): HasOne
    {
        return $this->hasOne(UserPreference::class);
    }
}
