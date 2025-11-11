<?php

namespace App\Http\Controllers;

use App\Models\UserPreference;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class PreferenceController extends Controller
{
    /**
     * Store or update preferences for a user.
     */
    public function store(Request $request, $userId)
    {
        $request->validate([
            'email_notifications_enabled' => 'boolean',
            'push_notifications_enabled' => 'boolean',
            'preferred_language' => 'string',
            'do_not_disturb_times' => 'json|nullable',
        ]);

        $preference = UserPreference::updateOrCreate(
            ['user_id' => $userId],
            $request->all()
        );

        Cache::forget('preferences_' . $userId); // Invalidate cache

        return response()->json([
            'success' => true,
            'data' => $preference,
            'message' => 'Preferences updated',
        ]);
    }

    /**
     * Get preferences for a user. Uses cache.
     */
    public function show($userId)
    {
        $preference = Cache::remember('preferences_' . $userId, 3600, function () use ($userId) {
            return UserPreference::where('user_id', $userId)->firstOrFail();
        });

        return response()->json([
            'success' => true,
            'data' => $preference,
            'message' => 'Preferences retrieved',
        ]);
    }
}
