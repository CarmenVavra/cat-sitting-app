<?php

declare(strict_types=1);

namespace App\Tests\Unit\Domain;

use App\Domain\BookingStatus;
use PHPUnit\Framework\TestCase;

final class BookingStatusTest extends TestCase
{
    public function testDerivesStatusFromToday(): void
    {
        $today = '2026-10-05';

        self::assertSame(BookingStatus::Ended, BookingStatus::of('2026-09-20', '2026-10-04', $today));
        self::assertSame(BookingStatus::Running, BookingStatus::of('2026-10-01', '2026-10-05', $today));
        self::assertSame(BookingStatus::Running, BookingStatus::of('2026-10-05', '2026-10-08', $today));
        self::assertSame(BookingStatus::Planned, BookingStatus::of('2026-10-06', '2026-10-08', $today));
    }
}
