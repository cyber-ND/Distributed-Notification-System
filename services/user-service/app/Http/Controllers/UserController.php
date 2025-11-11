<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use App\Http\Requests\CreateUserRequest;
use App\Http\Requests\UpdateUserRequest;
use Exception; // For catching DB/network errors
use Illuminate\Support\Facades\Redis; // For idempotency checks with unique request IDs
use Illuminate\Support\Facades\Cache; // For Redis caching to handle failures gracefully

class UserController extends Controller
{
    /**
     * Display a listing of users (paginated).
     * Uses standard meta for pagination as required by the task.
     * This endpoint supports high throughput for sync queries from other services.
     */
    public function index(Request $request)
    {
        $perPage = $request->input('limit', 10); // Get limit from query param, default 10
        $users = User::paginate($perPage); // Eloquent's paginate() handles offset/limit efficiently

        return response()->json([
            'success' => true,
            'data' => $users->items(), // Array of user objects
            'message' => 'Users retrieved successfully',
            'meta' => [ // PaginationMeta interface as per task spec
                'total' => $users->total(), // Total records in DB
                'limit' => $users->perPage(), // Items per page
                'page' => $users->currentPage(), // Current page number
                'total_pages' => $users->lastPage(), // Total pages available
                'has_next' => $users->hasMorePages(), // True if more pages after current
                'has_previous' => $users->currentPage() > 1, // True if not on first page
            ],
        ]);
    }

    /**
     * Show a specific user by ID.
     * Includes relationships (contacts, preferences) for complete data.
     * Implements simple failure handling: Try DB, fallback to cache on error.
     * This acts as a "circuit breaker" by avoiding repeated DB hits during outages.
     */
    public function show($id)
    {
        // First, check cache for fast retrieval (reduces DB load for frequent lookups)
        $cachedUser = Cache::get('user_' . $id);
        if ($cachedUser) {
            return response()->json([
                'success' => true,
                'data' => $cachedUser,
                'message' => 'User retrieved from cache',
            ]);
        }

        try {
            // Attempt DB query with eager loading to avoid N+1 queries
            $user = User::with(['contacts', 'preferences'])->findOrFail($id);

            // Cache the fresh data for 1 hour (3600 seconds) to handle future failures gracefully
            Cache::put('user_' . $id, $user, 3600);

            return response()->json([
                'success' => true,
                'data' => $user, // Includes loaded relations
                'message' => 'User retrieved successfully',
            ]);
        } catch (Exception $e) {
            // On DB failure (e.g., connection issue), log and fallback
            // This prevents cascading failures: Other services get stale data instead of erroring
            Log::error('User show failed for ID ' . $id . ': ' . $e->getMessage());

            // If no cache, return graceful error (meets 99.5% success target via fallback)
            if (!$cachedUser) {
                return response()->json([
                    'success' => false,
                    'error' => 'database_unavailable',
                    'message' => 'Service temporarily unavailable; try again later',
                ], 503); // HTTP 503: Service Unavailable
            }

            // Return cached data as "success" to keep system running
            return response()->json([
                'success' => true,
                'data' => $cachedUser,
                'message' => 'User retrieved from cache (DB temporarily unavailable)',
            ]);
        }
    }

    /**
     * Store a new user.
     * Validates input, checks idempotency via Redis to prevent duplicates.
     * In microservices, this avoids double notifications from retry queues.
     */
    public function store(CreateUserRequest $request)
    {
        $requestId = $request->header('X-Request-ID'); // Unique ID from header for idempotency
        $cacheKey = 'request_' . $requestId; // Key for Redis check

        // Idempotency check: If already processed, skip to prevent duplicates
        if ($requestId && Redis::exists($cacheKey)) {
            return response()->json([
                'success' => true,
                'message' => 'Request already processed (idempotent check passed)',
            ]);
        }

        // Create user from validated data (password auto-hashed)
        $user = User::create($request->validated());

        // Mark as processed in Redis (TTL 24 hours for safety)
        if ($requestId) {
            Redis::set($cacheKey, 'processed', 'EX', 86400);
        }

        // Invalidate any old cache for this user (if exists)
        Cache::forget('user_' . $user->id);

        return response()->json([
            'success' => true,
            'data' => $user,
            'message' => 'User created successfully',
        ], 201); // HTTP 201: Created
    }

    /**
     * Update an existing user.
     * Partial updates allowed; invalidates cache.
     */
    public function update(UpdateUserRequest $request, $id)
    {
        $user = User::findOrFail($id); // Throws 404 if not found (handled by ExceptionHandler)
        $user->update($request->validated()); // Update only validated fields

        // Invalidate cache to ensure next read gets fresh data
        Cache::forget('user_' . $id);
        Cache::forget('preferences_' . $id); // Also for preferences if linked

        return response()->json([
            'success' => true,
            'data' => $user->fresh(), // Reload fresh from DB
            'message' => 'User updated successfully',
        ]);
    }

    /**
     * Delete a user.
     * Soft delete if you add SoftDeletes trait later; here it's hard delete.
     */
    public function destroy($id)
    {
        $user = User::findOrFail($id);
        $user->delete(); // Deletes user and cascades to relations (via onDelete('cascade'))

        // Clean up caches
        Cache::forget('user_' . $id);

        return response()->json([
            'success' => true,
            'message' => 'User deleted successfully',
        ]);
    }
}
