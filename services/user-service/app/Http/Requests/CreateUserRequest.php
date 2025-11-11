<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CreateUserRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     * For now, allow everyone; add auth logic if needed.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     * Ensures data is valid before controller.
     */
    public function rules(): array
    {
        return [
            'username' => 'required|string|unique:users',
            'email' => 'required|email|unique:users',
            'password' => 'required|string|min:8',
        ];
    }

    /**
     * Custom error messages for validation failures.
     */
    public function messages(): array
    {
        return [
            'email.unique' => 'This email is already registered.',
        ];
    }
}
