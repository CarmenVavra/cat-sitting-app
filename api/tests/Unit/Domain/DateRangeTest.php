<?php

declare(strict_types=1);

namespace App\Tests\Unit\Domain;

use App\Domain\DateRange;
use App\Domain\Exception\ValidationException;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

final class DateRangeTest extends TestCase
{
    public function testCountsDaysInclusive(): void
    {
        self::assertSame(8, DateRange::create('2026-10-01', '2026-10-08')->dayCount());
        self::assertSame(1, DateRange::create('2026-10-05', '2026-10-05')->dayCount());
    }

    public function testCountsAcrossDaylightSavingChange(): void
    {
        self::assertSame(3, DateRange::create('2026-10-24', '2026-10-26')->dayCount());
    }

    public function testContainsIsInclusive(): void
    {
        $range = DateRange::create('2026-10-01', '2026-10-08');

        self::assertTrue($range->contains('2026-10-01'));
        self::assertTrue($range->contains('2026-10-08'));
        self::assertFalse($range->contains('2026-09-30'));
        self::assertFalse($range->contains('2026-10-09'));
    }

    public function testRejectsEndBeforeStart(): void
    {
        $this->expectException(ValidationException::class);
        $this->expectExceptionMessage('Ende liegt vor dem Beginn.');

        DateRange::create('2026-10-08', '2026-10-01');
    }

    #[DataProvider('invalidDates')]
    public function testRejectsInvalidDates(string $from, string $to): void
    {
        $this->expectException(ValidationException::class);
        $this->expectExceptionMessage('Bitte Beginn und Ende wählen.');

        DateRange::create($from, $to);
    }

    /**
     * @return iterable<string, array{string, string}>
     */
    public static function invalidDates(): iterable
    {
        yield 'empty' => ['', ''];
        yield 'missing end' => ['2026-10-01', ''];
        yield 'not a date' => ['2026-02-30', '2026-03-01'];
        yield 'wrong format' => ['01.10.2026', '2026-10-08'];
    }

    public function testRejectsTooLongRanges(): void
    {
        $this->expectException(ValidationException::class);

        DateRange::create('2026-01-01', '2027-06-01');
    }
}
