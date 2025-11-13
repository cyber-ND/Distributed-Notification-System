<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
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
 * - Embedded preferences and push tokens (no separate table)
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
        'name',
        'email',
        'password',
        'preferences',
        'push_tokens',
    ];

    /**
     * The attributes that should be cast to native types.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'push_tokens' => 'array',
        'preferences' => 'array',
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
     * Accessor: Get preferences as structured booleans for notifications.
     * Ensures preferences like "email_notifications_enabled" return true/false.
     */
    public function getPreferencesAttribute($value)
    {
        $preferences = json_decode($value, true) ?? [];

        return [
            'email_notifications_enabled' => (bool)($preferences['email_notifications_enabled'] ?? false),
            'push_notifications_enabled'  => (bool)($preferences['push_notifications_enabled'] ?? false),
            'preferred_language'          => $preferences['preferred_language'] ?? 'en',
            'do_not_disturb_times'        => $preferences['do_not_disturb_times'] ?? [],
        ];
    }

    /**
     * Mutator: Ensure preferences are always stored as JSON.
     */
    public function setPreferencesAttribute($value)
    {
        $this->attributes['preferences'] = json_encode($value);
    }
}
