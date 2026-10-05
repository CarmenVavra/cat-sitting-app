<?php

declare(strict_types=1);

namespace App\Tests\Functional;

use App\Tests\Support\ApiTestCase;

final class BookingApiTest extends ApiTestCase
{
    public function testCreatesBookingAndStoresOwnerWithCats(): void
    {
        $booking = $this->createBooking();

        self::assertSame('2026-10-01', $booking['from']);
        self::assertSame('2026-10-08', $booking['to']);
        self::assertSame(10.0, $booking['price']);
        self::assertFalse($booking['archived']);
        self::assertSame([], $booking['visits']);
        self::assertSame(['Minka', 'Felix'], array_column(self::list($booking, 'cats'), 'name'));

        $owners = $this->ok(200, 'GET', '/api/owners');
        self::assertCount(1, $owners);
        $owner = self::list($owners, 0);
        self::assertSame('Maria Huber', $owner['name']);
        self::assertSame('Lindengasse 12, 1070 Wien', $owner['address']);
        self::assertSame(['Minka', 'Felix'], array_column(self::list($owner, 'cats'), 'name'));
        self::assertSame($owner['id'], $booking['ownerId']);
    }

    public function testEmptyVisitsAreEncodedAsJsonObject(): void
    {
        $booking = $this->createBooking();

        $raw = $this->app->handle(new \App\Http\Request('GET', '/api/bookings/' . self::str($booking, 'id')))->body();

        self::assertStringContainsString('"visits":{}', $raw);
    }

    public function testReusesExistingOwnerCaseInsensitivelyAndUpdatesContact(): void
    {
        $this->createBooking('Maria Huber', ['Minka']);
        $second = $this->ok(201, 'POST', '/api/bookings', [
            'ownerName' => 'maria huber',
            'address' => 'Neue Adresse 1',
            'phone' => '',
            'email' => 'maria@mail.at',
            'cats' => ['minka', 'Felix'],
            'from' => '2026-11-01',
            'to' => '2026-11-02',
            'price' => 11.5,
        ]);

        $owners = $this->ok(200, 'GET', '/api/owners');
        self::assertCount(1, $owners);
        $owner = self::list($owners, 0);
        self::assertSame('Neue Adresse 1', $owner['address']);
        self::assertSame('maria@mail.at', $owner['email']);
        self::assertSame(['Minka', 'Felix'], array_column(self::list($owner, 'cats'), 'name'));
        self::assertSame(['Minka', 'Felix'], array_column(self::list($second, 'cats'), 'name'));
        self::assertSame(11.5, $second['price']);
    }

    public function testValidatesNewBookings(): void
    {
        $base = ['ownerName' => 'Maria', 'cats' => ['Minka'], 'from' => '2026-10-01', 'to' => '2026-10-02', 'price' => 10];

        $this->assertError(400, 'Name ist ein Pflichtfeld.', 'POST', '/api/bookings', ['ownerName' => ' '] + $base);
        $this->assertError(400, 'Mindestens eine Katze angeben.', 'POST', '/api/bookings', ['cats' => []] + $base);
        $this->assertError(400, 'Bitte Beginn und Ende wählen.', 'POST', '/api/bookings', ['to' => ''] + $base);
        $this->assertError(400, 'Ende liegt vor dem Beginn.', 'POST', '/api/bookings', ['to' => '2026-09-01'] + $base);
        $this->assertError(400, 'Feld "price" muss eine Zahl sein.', 'POST', '/api/bookings', ['price' => 'zehn'] + $base);
        $this->assertError(400, 'Der Preis muss zwischen 0 und 10.000 € liegen.', 'POST', '/api/bookings', ['price' => -5] + $base);

        self::assertSame([], $this->ok(200, 'GET', '/api/bookings'));
    }

    public function testAssignsAndClearsVisits(): void
    {
        $id = self::str($this->createBooking(), 'id');
        $anna = $this->createSitter('Anna', 'Weber');

        $booking = $this->ok(200, 'PUT', "/api/bookings/{$id}/visits/2026-10-05/F", ['sitterId' => $anna]);
        self::assertSame(['2026-10-05|F' => $anna], $booking['visits']);

        $booking = $this->ok(200, 'PUT', "/api/bookings/{$id}/visits/2026-10-04/A", ['sitterId' => $anna]);
        self::assertSame(['2026-10-04|A', '2026-10-05|F'], array_keys(self::list($booking, 'visits')));

        $booking = $this->ok(200, 'DELETE', "/api/bookings/{$id}/visits/2026-10-05/F");
        self::assertSame(['2026-10-04|A' => $anna], $booking['visits']);
    }

    public function testRejectsInvalidVisits(): void
    {
        $id = self::str($this->createBooking(), 'id');
        $anna = $this->createSitter('Anna');

        $this->assertError(400, 'Das Datum liegt außerhalb der Betreuung.', 'PUT', "/api/bookings/{$id}/visits/2026-10-09/F", ['sitterId' => $anna]);
        $this->assertError(400, 'Ungültiger Besuch: erlaubt sind F (Früh) und A (Abend).', 'PUT', "/api/bookings/{$id}/visits/2026-10-05/X", ['sitterId' => $anna]);
        $this->assertError(404, 'Betreuungsperson nicht gefunden.', 'PUT', "/api/bookings/{$id}/visits/2026-10-05/F", ['sitterId' => 'nope']);
        $this->assertError(400, 'Feld "sitterId" fehlt.', 'PUT', "/api/bookings/{$id}/visits/2026-10-05/F", []);
        $this->assertError(404, 'Betreuung nicht gefunden.', 'PUT', '/api/bookings/nope/visits/2026-10-05/F', ['sitterId' => $anna]);
    }

    public function testUpdatesPrice(): void
    {
        $id = self::str($this->createBooking(), 'id');

        $booking = $this->ok(200, 'PATCH', "/api/bookings/{$id}", ['price' => 12.5]);

        self::assertSame(12.5, $booking['price']);
        $this->assertError(400, 'Nichts zu ändern: "price" oder "archived" angeben.', 'PATCH', "/api/bookings/{$id}", []);
    }

    public function testArchivingIsOnlyAllowedAfterTheEnd(): void
    {
        $id = self::str($this->createBooking(to: '2026-10-08'), 'id');

        $this->assertError(409, 'Archivieren ist erst nach dem 08.10.2026 möglich.', 'PATCH', "/api/bookings/{$id}", ['archived' => true]);

        $this->clock->today = '2026-10-09';
        $booking = $this->ok(200, 'PATCH', "/api/bookings/{$id}", ['archived' => true]);
        self::assertTrue($booking['archived']);
    }

    public function testArchivedBookingsAreReadOnlyUntilRestored(): void
    {
        $id = self::str($this->createBooking(from: '2026-09-20', to: '2026-09-23'), 'id');
        $anna = $this->createSitter('Anna');
        $this->ok(200, 'PATCH', "/api/bookings/{$id}", ['archived' => true]);

        $message = 'Archivierte Betreuungen können nicht geändert werden.';
        $this->assertError(409, $message, 'PATCH', "/api/bookings/{$id}", ['price' => 20]);
        $this->assertError(409, $message, 'PUT', "/api/bookings/{$id}/visits/2026-09-20/F", ['sitterId' => $anna]);
        $this->assertError(409, $message, 'DELETE', "/api/bookings/{$id}/visits/2026-09-20/F");

        $restored = $this->ok(200, 'PATCH', "/api/bookings/{$id}", ['archived' => false]);
        self::assertFalse($restored['archived']);
        $this->ok(200, 'PUT', "/api/bookings/{$id}/visits/2026-09-20/F", ['sitterId' => $anna]);
    }

    public function testListsBookingsSortedByStart(): void
    {
        $this->createBooking('B', ['Luna'], '2026-10-12', '2026-10-15');
        $this->createBooking('A', ['Minka'], '2026-10-01', '2026-10-08');

        $list = $this->ok(200, 'GET', '/api/bookings');

        self::assertSame(['2026-10-01', '2026-10-12'], array_column($list, 'from'));
    }

    public function testUnknownBookingIs404(): void
    {
        $this->assertError(404, 'Betreuung nicht gefunden.', 'GET', '/api/bookings/does-not-exist');
    }

    /**
     * @param array<array-key, mixed> $json
     * @return array<array-key, mixed>
     */
    private static function list(array $json, int|string $key): array
    {
        $value = $json[$key] ?? null;
        self::assertIsArray($value);

        return $value;
    }
}
