<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule; // For advanced rules

class UpdateUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $userId = $this->route('id'); // Get ID from route
        return [
            'username' => ['string', Rule::unique('users')->ignore($userId)],
            'email' => ['email', Rule::unique('users')->ignore($userId)],
            'password' => 'string|min:8|nullable',
        ];
    }
}
