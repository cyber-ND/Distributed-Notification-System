<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    /**
     * List all users (paginated)
     */
    public function index(Request $request)
    {
        $limit = $request->input('limit', 10);
        $users = User::paginate($limit);

        // Format preferences so booleans show as true/false
        $users->getCollection()->transform(function ($user) {
            $user->preferences = $this->formatPreferences($user->preferences);
            return $user;
        });

        return response()->json([
            'success' => true,
            'data' => $users->items(),
            'meta' => [
                'total' => $users->total(),
                'limit' => $users->perPage(),
                'page' => $users->currentPage(),
                'total_pages' => $users->lastPage(),
            ],
        ]);
    }

    /**
     * Show one user
     */
    public function show($id)
    {
        $user = User::findOrFail($id);
        $user->preferences = $this->formatPreferences($user->preferences);

        return response()->json([
            'success' => true,
            'data' => $user,
        ]);
    }

    /**
     * Create a user
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string',
            'email' => 'required|email|unique:users',
            'password' => 'required|string|min:6',
            'preferences' => 'nullable|array',
            'push_tokens' => 'nullable|array',
        ]);

        $validated['password'] = Hash::make($validated['password']);
        $validated['preferences'] = $validated['preferences'] ?? [
            'email_notifications_enabled' => false,
            'push_notifications_enabled' => false,
        ];
        $validated['push_tokens'] = $validated['push_tokens'] ?? [];

        $user = User::create($validated);

        $user->preferences = $this->formatPreferences($user->preferences);

        return response()->json([
            'success' => true,
            'data' => $user,
        ], 201);
    }

    /**
     * Update a user
     */
    public function update(Request $request, $id)
    {
        $user = User::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|string',
            'email' => 'sometimes|email|unique:users,email,' . $id,
            'password' => 'sometimes|string|min:6',
            'preferences' => 'nullable|array',
            'push_tokens' => 'nullable|array',
        ]);

        if (isset($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        }

        $user->update($validated);
        $user->preferences = $this->formatPreferences($user->preferences);

        return response()->json([
            'success' => true,
            'data' => $user->fresh(),
        ]);
    }

    /**
     * Delete a user
     */
    public function destroy($id)
    {
        $user = User::findOrFail($id);
        $user->delete();

        return response()->json([
            'success' => true,
            'message' => 'User deleted successfully',
        ]);
    }

    /**
     * Helper: format preferences booleans
     */
    private function formatPreferences($preferences)
    {
        if (is_string($preferences)) {
            $preferences = json_decode($preferences, true);
        }

        return [
            'email_notifications_enabled' => (bool)($preferences['email_notifications_enabled'] ?? false),
            'push_notifications_enabled' => (bool)($preferences['push_notifications_enabled'] ?? false),
        ];
    }
}
