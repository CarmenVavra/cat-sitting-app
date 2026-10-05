<?php

declare(strict_types=1);

namespace App\Tests\Support;

use App\Application;
use App\Http\Request;
use App\Infrastructure\Database;
use PDO;
use PHPUnit\Framework\TestCase;
use Throwable;

/**
 * Runs requests through the full application against an in-memory database.
 */
abstract class ApiTestCase extends TestCase
{
    protected PDO $pdo;
    protected FixedClock $clock;
    protected Application $app;

    /** @var list<Throwable> */
    protected array $loggedErrors = [];

    protected function setUp(): void
    {
        $this->pdo = Database::connect('sqlite::memory:');
        Database::migrate($this->pdo);
        $this->clock = new FixedClock();
        $this->app = Application::create($this->pdo, $this->clock, function (Throwable $e): void {
            $this->loggedErrors[] = $e;
        });
    }

    /**
     * @param array<string, mixed>|null $body
     * @return array{status: int, json: array<array-key, mixed>|null}
     */
    protected function call(string $method, string $path, ?array $body = null): array
    {
        $raw = $body === null ? '' : json_encode($body, JSON_THROW_ON_ERROR);
        $response = $this->app->handle(new Request($method, $path, $raw));
        $text = $response->body();
        $json = $text === '' ? null : json_decode($text, true, 512, JSON_THROW_ON_ERROR);

        return ['status' => $response->status, 'json' => is_array($json) ? $json : null];
    }

    /**
     * Asserts the status and returns the decoded JSON object.
     *
     * @param array<string, mixed>|null $body
     * @return array<array-key, mixed>
     */
    protected function ok(int $expectedStatus, string $method, string $path, ?array $body = null): array
    {
        $result = $this->call($method, $path, $body);
        self::assertSame($expectedStatus, $result['status'], (string) json_encode($result['json']));

        return $result['json'] ?? [];
    }

    /**
     * @param array<string, mixed>|null $body
     */
    protected function assertError(int $expectedStatus, string $expectedMessage, string $method, string $path, ?array $body = null): void
    {
        $result = $this->call($method, $path, $body);
        self::assertSame($expectedStatus, $result['status']);
        self::assertSame(['error' => $expectedMessage], $result['json']);
    }

    protected function createSitter(string $first, string $last = ''): string
    {
        $json = $this->ok(201, 'POST', '/api/sitters', ['first' => $first, 'last' => $last]);

        return self::str($json, 'id');
    }

    /**
     * @param list<string> $cats
     * @return array<array-key, mixed>
     */
    protected function createBooking(
        string $owner = 'Maria Huber',
        array $cats = ['Minka', 'Felix'],
        string $from = '2026-10-01',
        string $to = '2026-10-08',
        float $price = 10,
    ): array {
        return $this->ok(201, 'POST', '/api/bookings', [
            'ownerId' => null,
            'ownerName' => $owner,
            'address' => 'Lindengasse 12, 1070 Wien',
            'phone' => '+43 664 123 45 67',
            'email' => '',
            'cats' => $cats,
            'from' => $from,
            'to' => $to,
            'price' => $price,
        ]);
    }

    /**
     * @param array<array-key, mixed> $json
     */
    protected static function str(array $json, string $key): string
    {
        $value = $json[$key] ?? null;
        self::assertIsString($value);

        return $value;
    }
}
