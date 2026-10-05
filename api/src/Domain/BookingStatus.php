<?php

declare(strict_types=1);

namespace App\Domain;

enum BookingStatus: string
{
    case Planned = 'planned';
    case Running = 'running';
    case Ended = 'ended';

    /**
     * ISO dates compare correctly as strings.
     */
    public static function of(string $from, string $to, string $today): self
    {
        return match (true) {
            $to < $today => self::Ended,
            $from > $today => self::Planned,
            default => self::Running,
        };
    }
}
