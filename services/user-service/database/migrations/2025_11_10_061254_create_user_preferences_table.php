<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_preferences', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->boolean('email_notifications_enabled')->default(true); // Default to allow emails
            $table->boolean('push_notifications_enabled')->default(true); // Default to allow pushes
            $table->string('preferred_language')->default('en'); // Default language code
            $table->json('do_not_disturb_times')->nullable(); // JSON array for time ranges, e.g., [{"start": "22:00", "end": "08:00"}]
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_preferences');
    }
};
