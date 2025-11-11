<?php

namespace App\Http\Controllers;

use App\Models\UserContact;
use Illuminate\Http\Request;

class ContactController extends Controller
{
    /**
     * Store or update contact for a user.
     */
    public function store(Request $request, $userId)
    {
        $request->validate([ // Simple validation
            'email' => 'email|nullable',
            'push_token' => 'string|nullable',
            'phone' => 'string|nullable',
        ]);

        $contact = UserContact::updateOrCreate( // Upsert based on user_id
            ['user_id' => $userId],
            $request->all()
        );

        return response()->json([
            'success' => true,
            'data' => $contact,
            'message' => 'Contact updated',
        ]);
    }

    /**
     * Get contacts for a user.
     */
    public function index($userId)
    {
        $contacts = UserContact::where('user_id', $userId)->get();

        return response()->json([
            'success' => true,
            'data' => $contacts,
            'message' => 'Contacts retrieved',
        ]);
    }
}
