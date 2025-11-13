<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ConsulService
{
    /**
     * Registers the service with Consul on startup.
     */
    public static function register()
    {
        $consulHost = config('services.consul.host', env('CONSUL_HOST'));
        $serviceId = env('SERVICE_ID', 'user-service-1');
        $serviceName = env('SERVICE_NAME', 'user-service');
        $serviceAddress = env('SERVICE_ADDRESS', '127.0.0.1');
        $servicePort = env('SERVICE_PORT', 8000);

        try {
            $payload = [
                'ID' => $serviceId,
                'Name' => $serviceName,
                'Address' => $serviceAddress,
                'Port' => (int) $servicePort,
                'Check' => [
                    'HTTP' => "http://{$serviceAddress}:{$servicePort}/health",
                    'Interval' => '10s',
                    'Timeout' => '5s',
                ],
            ];

            Http::put("{$consulHost}/v1/agent/service/register", $payload);

            Log::info("✅ Registered {$serviceName} with Consul successfully");
        } catch (\Exception $e) {
            Log::error("❌ Failed to register service with Consul: " . $e->getMessage());
        }
    }

    /**
     * Deregister the service on shutdown (optional for Docker setups).
     */
    public static function deregister()
    {
        $consulHost = config('services.consul.host', env('CONSUL_HOST'));
        $serviceId = env('SERVICE_ID', 'user-service-1');

        try {
            Http::put("{$consulHost}/v1/agent/service/deregister/{$serviceId}");
            Log::info("🧹 Deregistered {$serviceId} from Consul");
        } catch (\Exception $e) {
            Log::error("⚠️ Failed to deregister service: " . $e->getMessage());
        }
    }
}
