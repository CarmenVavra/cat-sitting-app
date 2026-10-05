<?php

declare(strict_types=1);

namespace App\Service;

final class CreateBookingCommand
{
    /**
     * @param list<string> $cats cat names; unknown ones are added to the owner
     */
    public function __construct(
        public readonly ?string $ownerId,
        public readonly string $ownerName,
        public readonly string $address,
        public readonly string $phone,
        public readonly string $email,
        public readonly array $cats,
        public readonly string $from,
        public readonly string $to,
        public readonly float $price,
    ) {}
}
