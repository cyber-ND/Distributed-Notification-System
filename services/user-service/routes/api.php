<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\ContactController;
use App\Http\Controllers\PreferenceController;
use App\Http\Controllers\HealthController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
| All routes here are prefixed with /api.
| Uses snake_case for route names.
*/

// Route::get('/', function () {
//     return view('welcome');
// });

// Public: Create new user (no auth required)
Route::post('/get-users', [App\Http\Controllers\UserController::class, 'store']);

// Public routes
Route::post('/login', [AuthController::class, 'login']);
Route::get('/health', [HealthController::class, 'check']); // Health check, no auth


// Authenticated routes
Route::middleware(['auth:sanctum'])->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/permissions/{id}', [AuthController::class, 'permissions']);

    // User routes with rate limiting (60 requests/min)
    Route::get('/users', [UserController::class, 'index'])
        ->name('users.index')
        ->middleware('throttle:60,1');

    Route::get('/users/{user}', [UserController::class, 'show'])
        ->name('users.show')
        ->middleware('throttle:60,1');

    Route::patch('/users/{user}', [UserController::class, 'update'])
        ->name('users.update')
        ->middleware('throttle:60,1');

    Route::delete('/users/{user}', [UserController::class, 'destroy'])
        ->name('users.destroy')
        ->middleware('throttle:60,1');

    // Contact routes
    Route::post('/users/{id}/contacts', [ContactController::class, 'store']);
    Route::get('/users/{id}/contacts', [ContactController::class, 'index']);

    // Preference routes
    Route::post('/users/{id}/preferences', [PreferenceController::class, 'store']);
    Route::get('/users/{id}/preferences', [PreferenceController::class, 'show']);
});
