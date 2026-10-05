<?php

declare(strict_types=1);

namespace App\Domain;

final class Booking
{
    /**
     * @param list<Cat> $cats
     * @param array<string, string> $visits "YYYY-MM-DD|F" => sitterId
     */
    public function __construct(
        public readonly string $id,
        public readonly string $ownerId,
        public readonly array $cats,
        public readonly DateRange $range,
        public readonly int $priceCents,
        public readonly bool $archived,
        public readonly array $visits,
    ) {}

    public function status(string $today): BookingStatus
    {
        return BookingStatus::of($this->range->from, $this->range->to, $today);
    }

    public static function visitKey(string $day, Slot $slot): string
    {
        return $day . '|' . $slot->value;
    }

    /**
     * @return array{id: string, ownerId: string, cats: list<array{id: string, name: string}>, from: string, to: string, price: float, archived: bool, visits: array<string, string>|object}
     */
    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'ownerId' => $this->ownerId,
            'cats' => array_map(static fn(Cat $cat): array => $cat->toArray(), $this->cats),
            'from' => $this->range->from,
            'to' => $this->range->to,
            'price' => Price::centsToEuros($this->priceCents),
            'archived' => $this->archived,
            // An empty PHP array would encode as [], the client expects an object.
            'visits' => $this->visits === [] ? (object) [] : $this->visits,
        ];
    }
}
