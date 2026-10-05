<?php

declare(strict_types=1);

namespace App\Tests\Functional;

use App\Tests\Support\ApiTestCase;

final class SitterApiTest extends ApiTestCase
{
    public function testCreatesAndListsSittersInCreationOrder(): void
    {
        $this->ok(201, 'POST', '/api/sitters', ['first' => ' Anna ', 'last' => 'Weber']);
        $this->ok(201, 'POST', '/api/sitters', ['first' => 'Lukas']);

        $list = $this->ok(200, 'GET', '/api/sitters');

        self::assertSame(
            [['first' => 'Anna', 'last' => 'Weber'], ['first' => 'Lukas', 'last' => '']],
            array_map(static fn(mixed $s): array => is_array($s) ? ['first' => $s['first'], 'last' => $s['last']] : [], $list),
        );
    }

    public function testFirstNameIsRequired(): void
    {
        $this->assertError(400, 'Vorname ist ein Pflichtfeld.', 'POST', '/api/sitters', ['first' => '  ', 'last' => 'Weber']);
    }

    public function testDeletesSitterWithoutVisits(): void
    {
        $id = $this->createSitter('Anna');

        $result = $this->call('DELETE', "/api/sitters/{$id}");

        self::assertSame(204, $result['status']);
        self::assertSame([], $this->ok(200, 'GET', '/api/sitters'));
    }

    public function testSitterWithVisitsCannotBeDeleted(): void
    {
        $id = $this->createSitter('Anna');
        $booking = self::str($this->createBooking(), 'id');
        $this->ok(200, 'PUT', "/api/bookings/{$booking}/visits/2026-10-01/F", ['sitterId' => $id]);

        $this->assertError(409, 'Personen mit erfassten Besuchen können nicht entfernt werden.', 'DELETE', "/api/sitters/{$id}");
    }

    public function testDeletingUnknownSitterIs404(): void
    {
        $this->assertError(404, 'Betreuungsperson nicht gefunden.', 'DELETE', '/api/sitters/nope');
    }
}
