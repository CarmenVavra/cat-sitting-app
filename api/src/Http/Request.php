<?php

declare(strict_types=1);

namespace App\Http;

use JsonException;

final class Request
{
    public readonly string $method;
    public readonly string $path;

    public function __construct(
        string $method,
        string $path,
        private readonly string $rawBody = '',
    ) {
        $this->method = strtoupper($method);
        $this->path = '/' . trim($path, '/');
    }

    public static function fromGlobals(): self
    {
        $method = is_string($_SERVER['REQUEST_METHOD'] ?? null) ? $_SERVER['REQUEST_METHOD'] : 'GET';
        $uri = is_string($_SERVER['REQUEST_URI'] ?? null) ? $_SERVER['REQUEST_URI'] : '/';
        $path = parse_url($uri, PHP_URL_PATH);
        $body = file_get_contents('php://input');

        return new self($method, is_string($path) ? rawurldecode($path) : '/', $body === false ? '' : $body);
    }

    /**
     * Decodes the JSON request body. An empty body is treated as an empty object.
     *
     * @return array<string, mixed>
     */
    public function json(): array
    {
        if (trim($this->rawBody) === '') {
            return [];
        }

        try {
            $data = json_decode($this->rawBody, true, 32, JSON_THROW_ON_ERROR);
        } catch (JsonException) {
            throw HttpException::badRequest('Ungültiges JSON im Request-Body.');
        }

        if (!is_array($data) || ($data !== [] && array_is_list($data))) {
            throw HttpException::badRequest('Der Request-Body muss ein JSON-Objekt sein.');
        }

        /** @var array<string, mixed> $data */
        return $data;
    }
}
