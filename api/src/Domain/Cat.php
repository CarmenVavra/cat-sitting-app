<?php

declare(strict_types=1);

namespace App\Domain;

final class Cat
{
    public function __construct(
        public readonly string $id,
        public readonly string $ownerId,
        public readonly string $name,
    ) {}

    /**
     * @return array{id: string, name: string}
     */
    public function toArray(): array
    {
        return ['id' => $this->id, 'name' => $this->name];
    }
}
