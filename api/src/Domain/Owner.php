<?php

declare(strict_types=1);

namespace App\Domain;

final class Owner
{
    /**
     * @param list<Cat> $cats
     */
    public function __construct(
        public readonly string $id,
        public readonly string $name,
        public readonly string $address,
        public readonly string $phone,
        public readonly string $email,
        public readonly array $cats,
    ) {}

    /**
     * @return array{id: string, name: string, address: string, phone: string, email: string, cats: list<array{id: string, name: string}>}
     */
    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'address' => $this->address,
            'phone' => $this->phone,
            'email' => $this->email,
            'cats' => array_map(static fn(Cat $cat): array => $cat->toArray(), $this->cats),
        ];
    }
}
