<?php

declare(strict_types=1);

namespace App\Tests\Functional;

use App\Application;
use App\Domain\Clock;
use App\Http\Request;
use App\Infrastructure\Database;
use App\Tests\Support\ApiTestCase;
use RuntimeException;
use Throwable;

final class SettingsAndErrorsApiTest extends ApiTestCase
{
    public function testDefaultPriceIsTenEuros(): void
    {
        self::assertSame(['defaultPrice' => 10.0], $this->ok(200, 'GET', '/api/settings'));
    }

    public function testUpdatesDefaultPrice(): void
    {
        self::assertSame(['defaultPrice' => 12.5], $this->ok(200, 'PUT', '/api/settings', ['defaultPrice' => 12.5]));
        self::assertSame(['defaultPrice' => 12.5], $this->ok(200, 'GET', '/api/settings'));

        $this->assertError(400, 'Feld "defaultPrice" muss eine Zahl sein.', 'PUT', '/api/settings', []);
    }

    public function testUnknownRouteAndWrongMethod(): void
    {
        $this->assertError(404, 'Endpunkt nicht gefunden.', 'GET', '/api/nope');
        $this->assertError(405, 'Methode nicht erlaubt.', 'DELETE', '/api/settings');
    }

    public function testInvalidJsonBodyIs400(): void
    {
        $response = $this->app->handle(new Request('POST', '/api/sitters', '{"first":'));

        self::assertSame(400, $response->status);
        self::assertSame(['error' => 'Ungültiges JSON im Request-Body.'], $response->data);
    }

    public function testUnexpectedErrorsAreLoggedButNotExposed(): void
    {
        $failingClock = $this->createMock(Clock::class);
        $failingClock->method('today')->willThrowException(new RuntimeException('secret internals'));

        $pdo = Database::connect('sqlite::memory:');
        Database::migrate($pdo);
        $logged = [];
        $app = Application::create($pdo, $failingClock, static function (Throwable $e) use (&$logged): void {
            $logged[] = $e->getMessage();
        });

        $create = new Request('POST', '/api/bookings', (string) json_encode([
            'ownerName' => 'Maria', 'cats' => ['Minka'], 'from' => '2026-10-01', 'to' => '2026-10-02', 'price' => 10,
        ]));
        $booking = $app->handle($create)->data;
        self::assertIsArray($booking);
        self::assertIsString($booking['id']);

        $response = $app->handle(new Request('PATCH', '/api/bookings/' . $booking['id'], '{"archived":true}'));

        self::assertSame(500, $response->status);
        self::assertSame(['error' => 'Interner Serverfehler.'], $response->data);
        self::assertStringNotContainsString('secret', $response->body());
        self::assertSame(['secret internals'], $logged);
    }
}
