<?php

declare(strict_types=1);

namespace App\Tests\Support;

use App\Domain\Clock;

final class FixedClock implements Clock
{
    public function __construct(public string $today = '2026-10-05') {}

    public function today(): string
    {
        return $this->today;
    }
}
