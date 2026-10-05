<?php

declare(strict_types=1);

namespace App\Domain;

final class Sitter
{
    public function __construct(
        public readonly string $id,
        public readonly string $first,
        public readonly string $last,
    ) {}

    /**
     * @return array{id: string, first: string, last: string}
     */
    public function toArray(): array
    {
        return ['id' => $this->id, 'first' => $this->first, 'last' => $this->last];
    }
}
