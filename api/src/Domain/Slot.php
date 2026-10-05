<?php

declare(strict_types=1);

namespace App\Domain;

/**
 * The two daily visits: F = Früh (morning), A = Abend (evening).
 */
enum Slot: string
{
    case Morning = 'F';
    case Evening = 'A';

    public function label(): string
    {
        return match ($this) {
            self::Morning => 'Früh',
            self::Evening => 'Abend',
        };
    }
}
