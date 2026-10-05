<?php

declare(strict_types=1);

namespace App\Tests\Unit\Infrastructure;

use App\Infrastructure\Database;
use App\Infrastructure\OwnerRepository;
use PHPUnit\Framework\TestCase;

final class OwnerRepositoryTest extends TestCase
{
    private OwnerRepository $owners;

    protected function setUp(): void
    {
        $pdo = Database::connect('sqlite::memory:');
        Database::migrate($pdo);
        $this->owners = new OwnerRepository($pdo);
    }

    public function testFindsOwnersCaseInsensitivelyIncludingUmlauts(): void
    {
        $owner = $this->owners->create('Jörg Müller', '', '', '');

        self::assertSame($owner->id, $this->owners->findByName('JÖRG MÜLLER')?->id);
        self::assertNull($this->owners->findByName('Jörg'));
    }

    public function testAddCatIsIdempotentPerOwner(): void
    {
        $owner = $this->owners->create('Maria Huber', '', '', '');

        $first = $this->owners->addCat($owner->id, 'Minka');
        $second = $this->owners->addCat($owner->id, 'MINKA');
        $this->owners->addCat($owner->id, 'Felix');

        self::assertSame($first->id, $second->id);
        self::assertSame(['Minka', 'Felix'], array_map(
            static fn($cat): string => $cat->name,
            $this->owners->find($owner->id)->cats ?? [],
        ));
    }

    public function testListsOwnersWithTheirCats(): void
    {
        $a = $this->owners->create('A', 'Straße 1', '', '');
        $b = $this->owners->create('B', '', '', '');
        $this->owners->addCat($b->id, 'Luna');

        $all = $this->owners->all();

        self::assertCount(2, $all);
        self::assertSame($a->id, $all[0]->id);
        self::assertSame([], $all[0]->cats);
        self::assertSame('Luna', $all[1]->cats[0]->name);
    }
}
