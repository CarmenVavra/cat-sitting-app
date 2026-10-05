<?php

declare(strict_types=1);

namespace App\Tests\Functional;

use App\Tests\Support\ApiTestCase;

final class OwnerApiTest extends ApiTestCase
{
    public function testCreatesOwnerWithCats(): void
    {
        $owner = $this->ok(201, 'POST', '/api/owners', [
            'name' => 'Thomas Berger',
            'phone' => '+43 699 555 01 02',
            'cats' => ['Luna'],
        ]);

        self::assertSame('Thomas Berger', $owner['name']);
        self::assertSame('+43 699 555 01 02', $owner['phone']);
        self::assertSame('', $owner['address']);
        self::assertIsArray($owner['cats']);
        self::assertSame(['Luna'], array_column($owner['cats'], 'name'));
    }

    public function testReturnsExistingOwnerForSameNameWith200(): void
    {
        $first = $this->ok(201, 'POST', '/api/owners', ['name' => 'Maria Huber']);
        $second = $this->ok(200, 'POST', '/api/owners', ['name' => 'MARIA HUBER']);

        self::assertSame($first['id'], $second['id']);
        self::assertSame('Maria Huber', $second['name']);
    }

    public function testNameIsRequired(): void
    {
        $this->assertError(400, 'Name ist ein Pflichtfeld.', 'POST', '/api/owners', ['name' => '']);
    }

    public function testAddsCatsWithoutDuplicates(): void
    {
        $id = self::str($this->ok(201, 'POST', '/api/owners', ['name' => 'Maria Huber']), 'id');

        $this->ok(200, 'POST', "/api/owners/{$id}/cats", ['name' => 'Minka']);
        $owner = $this->ok(200, 'POST', "/api/owners/{$id}/cats", ['name' => 'minka']);

        self::assertIsArray($owner['cats']);
        self::assertSame(['Minka'], array_column($owner['cats'], 'name'));
    }

    public function testAddCatValidatesInput(): void
    {
        $id = self::str($this->ok(201, 'POST', '/api/owners', ['name' => 'Maria Huber']), 'id');

        $this->assertError(400, 'Katzenname ist ein Pflichtfeld.', 'POST', "/api/owners/{$id}/cats", ['name' => ' ']);
        $this->assertError(404, 'Besitzer:in nicht gefunden.', 'POST', '/api/owners/nope/cats', ['name' => 'Minka']);
    }
}
