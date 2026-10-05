<?php

declare(strict_types=1);

namespace App\Infrastructure;

final class Ids
{
    public static function generate(): string
    {
        return bin2hex(random_bytes(8));
    }
}
