<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth; // For authentication checks
use App\Models\User; // User model for finding users
use Laravel\Sanctum\HasApiTokens; // For API token management

class AuthController extends Controller
{
    /**
     * Handle user login. Validates input, authenticates, returns token.
     * Response format: {success: bool, data?: {}, message: str, error?: str}
     */
    public function login(Request $request)
    {
        $credentials = $request->validate([ // Validate input data
            'email' => 'required|email',
            'password' => 'required',
        ]);

        if (Auth::attempt($credentials)) { // Try to authenticate
            $user = Auth::user();
            $token = $user->createToken('api-token')->plainTextToken; // Generate Sanctum token

            return response()->json([ // Standard success response
                'success' => true,
                'data' => ['token' => $token],
                'message' => 'Login successful',
            ]);
        }

        return response()->json([ // Failure response
            'success' => false,
            'error' => 'unauthorized',
            'message' => 'Invalid credentials',
        ], 401);
    }

    /**
     * Handle logout. Revokes the current token.
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete(); // Delete the token

        return response()->json([
            'success' => true,
            'message' => 'Logout successful',
        ]);
    }

    /**
     * Get user permissions. Returns roles/permissions for the user.
     */
    public function permissions($id)
    {
        $user = User::findOrFail($id); // Find user or 404

        return response()->json([
            'success' => true,
            'data' => [
                'roles' => $user->getRoleNames(), // From Spatie
                'permissions' => $user->getAllPermissions()->pluck('name'), // All permissions
            ],
            'message' => 'Permissions retrieved',
        ]);
    }
}
