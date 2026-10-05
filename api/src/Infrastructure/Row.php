<?php

declare(strict_types=1);

namespace App\Infrastructure;

use UnexpectedValueException;

/**
 * Type-safe access to rows fetched with PDO::FETCH_ASSOC.
 */
final class Row
{
    /**
     * @param array<array-key, mixed> $row
     */
    public static function string(array $row, string $key): string
    {
        $value = $row[$key] ?? null;
        if (is_string($value)) {
            return $value;
        }
        if (is_int($value)) {
            return (string) $value;
        }

        throw new UnexpectedValueException(sprintf('Column "%s" is not a string.', $key));
    }

    /**
     * @param array<array-key, mixed> $row
     */
    public static function int(array $row, string $key): int
    {
        $value = $row[$key] ?? null;
        if (is_int($value)) {
            return $value;
        }
        if (is_string($value) && is_numeric($value)) {
            return (int) $value;
        }

        throw new UnexpectedValueException(sprintf('Column "%s" is not an integer.', $key));
    }

    /**
     * @return list<array<array-key, mixed>>
     */
    public static function all(\PDOStatement $statement): array
    {
        $rows = [];
        while (is_array($row = $statement->fetch())) {
            $rows[] = $row;
        }

        return $rows;
    }

    /**
     * @return array<array-key, mixed>|null
     */
    public static function one(\PDOStatement $statement): ?array
    {
        $row = $statement->fetch();

        return is_array($row) ? $row : null;
    }
}
