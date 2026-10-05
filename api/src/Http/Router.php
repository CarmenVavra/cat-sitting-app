<?php

declare(strict_types=1);

namespace App\Http;

use Closure;

/**
 * Minimal path router. Patterns use `{name}` placeholders that match one path segment.
 */
final class Router
{
    /** @var list<array{method: string, regex: string, handler: Closure(Request, array<string, string>): JsonResponse}> */
    private array $routes = [];

    /**
     * @param Closure(Request, array<string, string>): JsonResponse $handler
     */
    public function add(string $method, string $pattern, Closure $handler): void
    {
        $regex = preg_replace('#\{([a-zA-Z]+)\}#', '(?P<$1>[^/]+)', $pattern);
        $this->routes[] = [
            'method' => strtoupper($method),
            'regex' => '#^' . $regex . '$#',
            'handler' => $handler,
        ];
    }

    public function dispatch(Request $request): JsonResponse
    {
        $pathMatched = false;

        foreach ($this->routes as $route) {
            if (preg_match($route['regex'], $request->path, $matches) !== 1) {
                continue;
            }

            $pathMatched = true;
            if ($route['method'] !== $request->method) {
                continue;
            }

            $params = array_filter($matches, static fn(int|string $key): bool => is_string($key), ARRAY_FILTER_USE_KEY);

            return ($route['handler'])($request, $params);
        }

        if ($pathMatched) {
            throw HttpException::methodNotAllowed();
        }

        throw HttpException::notFound('Endpunkt nicht gefunden.');
    }
}
