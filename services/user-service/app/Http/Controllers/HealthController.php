<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\DB; // For DB connection
use Illuminate\Support\Facades\Redis; // For Redis ping

class HealthController extends Controller
{
    /**
     * Check service health. Pings DB and Redis.
     * Returns 200 if healthy, else 503.
     */
    public function check()
    {
        $status = 'healthy';
        $details = [];

        try {
            DB::connection()->getPdo(); // Try DB connection
            $details['db'] = 'connected';
        } catch (\Exception $e) {
            $status = 'unhealthy';
            $details['db'] = 'disconnected';
        }

        try {
            Redis::ping(); // Try Redis connection
            $details['redis'] = 'connected';
        } catch (\Exception $e) {
            $status = 'unhealthy';
            $details['redis'] = 'disconnected';
        }

        return response()->json([
            'status' => $status,
            ...$details, // Spread details into response
        ], $status === 'healthy' ? 200 : 503);
    }
}
