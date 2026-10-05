<?php

declare(strict_types=1);

namespace App\Tests\Unit\Domain;

use App\Domain\Exception\ValidationException;
use App\Domain\Price;
use PHPUnit\Framework\TestCase;

final class PriceTest extends TestCase
{
    public function testConvertsBetweenEurosAndCents(): void
    {
        self::assertSame(1050, Price::eurosToCents(10.5));
        self::assertSame(30, Price::eurosToCents(0.3));
        self::assertSame(0, Price::eurosToCents(0));
        self::assertSame(12.5, Price::centsToEuros(1250));
    }

    public function testRejectsNegativePrices(): void
    {
        $this->expectException(ValidationException::class);

        Price::eurosToCents(-1);
    }

    public function testRejectsAbsurdPrices(): void
    {
        $this->expectException(ValidationException::class);

        Price::eurosToCents(1_000_000);
    }
}
