<?php

declare(strict_types=1);

namespace App\Infrastructure;

use PDO;

final class SettingsRepository
{
    private const DEFAULT_PRICE_KEY = 'default_price_cents';

    public function __construct(private readonly PDO $pdo) {}

    public function defaultPriceCents(): int
    {
        $statement = $this->pdo->prepare('SELECT value FROM settings WHERE key = :key');
        $statement->execute(['key' => self::DEFAULT_PRICE_KEY]);
        $row = Row::one($statement);

        return $row === null ? 1000 : Row::int($row, 'value');
    }

    public function setDefaultPriceCents(int $cents): void
    {
        $statement = $this->pdo->prepare(
            'INSERT INTO settings (key, value) VALUES (:key, :value)
             ON CONFLICT (key) DO UPDATE SET value = excluded.value',
        );
        $statement->execute(['key' => self::DEFAULT_PRICE_KEY, 'value' => (string) $cents]);
    }
}
