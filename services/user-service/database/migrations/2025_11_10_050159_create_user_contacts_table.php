<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_contacts', function (Blueprint $table) {
            $table->id(); // Primary key
            $table->foreignId('user_id')->constrained()->onDelete('cascade'); // Links to users table, delete if user deleted
            $table->string('email')->nullable(); // Optional email
            $table->string('push_token')->nullable(); // Optional push notification token for devices
            $table->string('phone')->nullable(); // Optional phone number
            $table->timestamps(); // Timestamps for creation/update
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_contacts');
    }
};
