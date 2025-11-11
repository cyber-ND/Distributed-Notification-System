<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\UserContact;
use App\Models\UserPreference;
use Spatie\Permission\Models\Role;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds. This populates the DB with test data.
     * Useful for development and testing.
     */
    public function run(): void
    {
        // Create a role if not exists
        $role = Role::firstOrCreate(['name' => 'user']); // Basic user role

        // Create a sample user
        $user = User::create([
            'username' => 'testuser',
            'email' => 'test@example.com',
            'password' => 'password', // Will be hashed automatically
        ]);

        $user->assignRole($role); // Assign role using Spatie

        // Add contact
        UserContact::create([
            'user_id' => $user->id,
            'email' => 'test@example.com',
            'push_token' => 'sample_token',
        ]);

        // Add preference
        UserPreference::create([
            'user_id' => $user->id,
            'email_notifications_enabled' => true,
            'push_notifications_enabled' => true,
            'preferred_language' => 'en',
            'do_not_disturb_times' => json_encode([['start' => '22:00', 'end' => '08:00']]),
        ]);
    }
}
