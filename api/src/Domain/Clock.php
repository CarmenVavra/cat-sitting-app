<?php

declare(strict_types=1);

namespace App\Domain;

interface Clock
{
    /**
     * Today's date as ISO string (YYYY-MM-DD) in the app's time zone.
     */
    public function today(): string;
}
