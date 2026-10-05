<?php

declare(strict_types=1);

namespace App\Http;

use RuntimeException;

/**
 * An error that is safe to show to API clients. The message is returned as
 * `{ "error": "..." }` together with the given HTTP status code.
 */
final class HttpException extends RuntimeException
{
    public function __construct(
        public readonly int $status,
        string $message,
    ) {
        parent::__construct($message);
    }

    public static function badRequest(string $message): self
    {
        return new self(400, $message);
    }

    public static function notFound(string $message): self
    {
        return new self(404, $message);
    }

    public static function methodNotAllowed(): self
    {
        return new self(405, 'Methode nicht erlaubt.');
    }

    public static function conflict(string $message): self
    {
        return new self(409, $message);
    }
}
