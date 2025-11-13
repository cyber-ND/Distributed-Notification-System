<?php

namespace App\Exceptions;

use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Throwable;
use Illuminate\Http\Request; // ADD THIS

class Handler extends ExceptionHandler
{
    protected $dontReport = [
        //
    ];

    /**
     * Render an exception into an HTTP response.
     */
    public function render($request, Throwable $exception) // $request is a parameter!
    {
        // ADD THIS: Type hint and ensure $request is available
        if (!$request instanceof Request) {
            return parent::render($request, $exception);
        }

        // Force consistent JSON structure for all API routes
        if ($request->is('api/*') || $request->expectsJson()) {
            $status = 500;
            $message = 'Server Error';
            $data = null;

            if ($exception instanceof HttpExceptionInterface) {
                $status = $exception->getStatusCode();
                $message = $exception->getMessage() ?: $message;
            } elseif ($exception instanceof ValidationException) {
                $status = 422;
                $message = 'Validation failed';
                $data = $exception->errors();
            } elseif ($exception instanceof AuthenticationException) {
                $status = 401;
                $message = 'Unauthenticated';
            } elseif ($exception instanceof NotFoundHttpException) {
                $status = 404;
                $message = 'Resource not found';
            } elseif ($exception->getMessage()) {
                $message = $exception->getMessage();
            }

            return response()->json([
                'message' => $message,
                'data' => $data,
                'success' => false,
            ], $status);
        }

        return parent::render($request, $exception);
    }

    /**
     * Convert an authentication exception into a response.
     */
    protected function unauthenticated($request, AuthenticationException $exception)
    {
        if ($request->is('api/*') || $request->expectsJson()) {
            return response()->json([
                'message' => 'Unauthenticated',
                'data' => null,
                'success' => false,
            ], 401);
        }

        return redirect()->guest(route('login'));
    }
}
