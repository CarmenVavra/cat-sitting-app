<?php

declare(strict_types=1);

namespace App\Tests\Unit\Http;

use App\Http\HttpException;
use App\Http\JsonResponse;
use App\Http\Request;
use App\Http\Router;
use PHPUnit\Framework\TestCase;

final class RouterTest extends TestCase
{
    public function testPassesPlaceholdersToHandler(): void
    {
        $router = new Router();
        $router->add('PUT', '/api/bookings/{id}/visits/{day}/{slot}', static fn(Request $r, array $p): JsonResponse => new JsonResponse($p));

        $response = $router->dispatch(new Request('put', '/api/bookings/b1/visits/2026-10-05/F/'));

        self::assertSame(['id' => 'b1', 'day' => '2026-10-05', 'slot' => 'F'], $response->data);
    }

    public function testUnknownPathIs404(): void
    {
        $router = new Router();
        $router->add('GET', '/api/sitters', static fn(): JsonResponse => new JsonResponse([]));

        try {
            $router->dispatch(new Request('GET', '/api/unknown'));
            self::fail('Expected HttpException');
        } catch (HttpException $e) {
            self::assertSame(404, $e->status);
        }
    }

    public function testWrongMethodIs405(): void
    {
        $router = new Router();
        $router->add('GET', '/api/sitters', static fn(): JsonResponse => new JsonResponse([]));

        try {
            $router->dispatch(new Request('DELETE', '/api/sitters'));
            self::fail('Expected HttpException');
        } catch (HttpException $e) {
            self::assertSame(405, $e->status);
        }
    }
}
