<?php

declare(strict_types=1);

namespace App\Tests\Unit\Http;

use App\Http\HttpException;
use App\Http\Input;
use App\Http\Request;
use PHPUnit\Framework\TestCase;

final class InputTest extends TestCase
{
    public function testTrimsStringsAndTreatsNullAsEmpty(): void
    {
        $input = new Input(['name' => '  Maria  ', 'phone' => null]);

        self::assertSame('Maria', $input->optionalString('name'));
        self::assertSame('', $input->optionalString('phone'));
        self::assertSame('', $input->optionalString('missing'));
        self::assertNull($input->nullableString('phone'));
    }

    public function testStringListDropsEmptyEntries(): void
    {
        $input = new Input(['cats' => [' Minka ', '', 'Felix']]);

        self::assertSame(['Minka', 'Felix'], $input->stringList('cats'));
    }

    public function testRejectsWrongTypes(): void
    {
        $this->expectException(HttpException::class);

        (new Input(['price' => '10']))->number('price');
    }

    public function testRejectsOverlongText(): void
    {
        $this->expectException(HttpException::class);

        (new Input(['name' => str_repeat('a', 201)]))->optionalString('name');
    }

    public function testRequestRejectsInvalidJson(): void
    {
        $this->expectException(HttpException::class);
        $this->expectExceptionMessage('Ungültiges JSON im Request-Body.');

        (new Request('POST', '/api/sitters', '{nope'))->json();
    }

    public function testRequestRejectsJsonArrays(): void
    {
        $this->expectException(HttpException::class);

        (new Request('POST', '/api/sitters', '[1,2]'))->json();
    }
}
