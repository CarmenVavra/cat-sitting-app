<?php

declare(strict_types=1);

namespace App\Http;

final class JsonResponse
{
    /**
     * @param array<array-key, mixed>|null $data null produces an empty body (use with 204)
     */
    public function __construct(
        public readonly ?array $data,
        public readonly int $status = 200,
    ) {}

    public static function noContent(): self
    {
        return new self(null, 204);
    }

    public static function error(string $message, int $status): self
    {
        return new self(['error' => $message], $status);
    }

    public function body(): string
    {
        if ($this->data === null) {
            return '';
        }

        return json_encode(
            $this->data,
            JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRESERVE_ZERO_FRACTION,
        );
    }

    public function send(): void
    {
        $body = $this->body();
        http_response_code($this->status);
        header('Content-Type: application/json; charset=utf-8');
        header('Cache-Control: no-store');
        header('X-Content-Type-Options: nosniff');
        echo $body;
    }
}
