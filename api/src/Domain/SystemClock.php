<?php

declare(strict_types=1);

namespace App\Domain;

use DateTimeImmutable;
use DateTimeZone;

final class SystemClock implements Clock
{
    public function __construct(private readonly DateTimeZone $timeZone) {}

    public function today(): string
    {
        return (new DateTimeImmutable('now', $this->timeZone))->format('Y-m-d');
    }
}
