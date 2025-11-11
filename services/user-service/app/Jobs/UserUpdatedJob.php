<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Support\Facades\Log;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use PhpAmqpLib\Connection\AMQPStreamConnection;
use PhpAmqpLib\Message\AMQPMessage;
use Throwable;

/**
 * Job to publish user update events to RabbitMQ.
 * Used when user preferences change — other services can react.
 */
class UserUpdatedJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $user;

    public function __construct($user)
    {
        $this->user = $user;
    }

    public function handle(): void
{
    $sslOptions = [
        'verify_peer' => false,
        'verify_peer_name' => false,
    ];

    $connection = new AMQPStreamConnection(
        env('RABBITMQ_HOST'),
        (int) env('RABBITMQ_PORT', 5671),
        env('RABBITMQ_USER'),
        env('RABBITMQ_PASSWORD'),
        env('RABBITMQ_VHOST', '/'),
        env('RABBITMQ_USE_SSL', false),
        $sslOptions
    );

    $channel = $connection->channel();

    $channel->exchange_declare(
        'notifications.direct',
        'direct',
        false,
        true,
        false
    );

    $payload = json_encode([
        'user_id' => $this->user->id,
        'event' => 'preferences_updated',
        'timestamp' => now()->toISOString(),
    ]);

    $message = new AMQPMessage($payload, [
        'delivery_mode' => AMQPMessage::DELIVERY_MODE_PERSISTENT,
        'content_type' => 'application/json',
    ]);

    $channel->basic_publish($message, 'notifications.direct', 'user.updated');

    $channel->close();
    $connection->close();
}

    /**
     * Handle failed job with logging.
     *
     * @param  \Throwable  $exception
     */
    public function failed(Throwable $exception): void
    {
        Log::error('UserUpdatedJob failed for user ID: ' . ($this->user->id ?? 'unknown'), [
            'error' => $exception->getMessage(),
            'file' => $exception->getFile(),
            'line' => $exception->getLine(),
            'trace' => $exception->getTraceAsString(),
        ]);
    }
}
