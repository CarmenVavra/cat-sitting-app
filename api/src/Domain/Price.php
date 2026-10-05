<?php

declare(strict_types=1);

namespace App\Domain;

use App\Domain\Exception\ValidationException;

/**
 * Prices are stored as integer cents to avoid floating point drift and exposed as euros.
 */
final class Price
{
    public const MAX_EUROS = 10000.0;

    /**
     * @throws ValidationException with a user-facing German message
     */
    public static function eurosToCents(float $euros): int
    {
        if (!is_finite($euros) || $euros < 0 || $euros > self::MAX_EUROS) {
            throw new ValidationException('Der Preis muss zwischen 0 und 10.000 € liegen.');
        }

        return (int) round($euros * 100);
    }

    public static function centsToEuros(int $cents): float
    {
        return $cents / 100;
    }
}
