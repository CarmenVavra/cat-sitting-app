<?php

declare(strict_types=1);

namespace App\Infrastructure;

use PDO;

final class Database
{
    private const SCHEMA = <<<'SQL'
        CREATE TABLE IF NOT EXISTS settings (
            key   TEXT PRIMARY KEY,
            value TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS sitters (
            id         TEXT PRIMARY KEY,
            first_name TEXT NOT NULL,
            last_name  TEXT NOT NULL DEFAULT ''
        );

        CREATE TABLE IF NOT EXISTS owners (
            id       TEXT PRIMARY KEY,
            name     TEXT NOT NULL,
            name_key TEXT NOT NULL UNIQUE,
            address  TEXT NOT NULL DEFAULT '',
            phone    TEXT NOT NULL DEFAULT '',
            email    TEXT NOT NULL DEFAULT ''
        );

        CREATE TABLE IF NOT EXISTS cats (
            id       TEXT PRIMARY KEY,
            owner_id TEXT NOT NULL REFERENCES owners (id) ON DELETE CASCADE,
            name     TEXT NOT NULL,
            name_key TEXT NOT NULL,
            UNIQUE (owner_id, name_key)
        );

        CREATE TABLE IF NOT EXISTS bookings (
            id          TEXT PRIMARY KEY,
            owner_id    TEXT NOT NULL REFERENCES owners (id),
            date_from   TEXT NOT NULL,
            date_to     TEXT NOT NULL,
            price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
            archived    INTEGER NOT NULL DEFAULT 0,
            CHECK (date_to >= date_from)
        );

        CREATE TABLE IF NOT EXISTS booking_cats (
            booking_id TEXT NOT NULL REFERENCES bookings (id) ON DELETE CASCADE,
            cat_id     TEXT NOT NULL REFERENCES cats (id),
            position   INTEGER NOT NULL,
            PRIMARY KEY (booking_id, cat_id)
        );

        CREATE TABLE IF NOT EXISTS visits (
            booking_id TEXT NOT NULL REFERENCES bookings (id) ON DELETE CASCADE,
            day        TEXT NOT NULL,
            slot       TEXT NOT NULL CHECK (slot IN ('F', 'A')),
            sitter_id  TEXT NOT NULL REFERENCES sitters (id),
            PRIMARY KEY (booking_id, day, slot)
        );

        CREATE INDEX IF NOT EXISTS visits_sitter ON visits (sitter_id);

        INSERT OR IGNORE INTO settings (key, value) VALUES ('default_price_cents', '1000');
        SQL;

    public static function connect(string $dsn): PDO
    {
        $pdo = new PDO($dsn, null, null, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]);
        $pdo->exec('PRAGMA foreign_keys = ON');

        return $pdo;
    }

    public static function migrate(PDO $pdo): void
    {
        $pdo->exec(self::SCHEMA);
    }

    /**
     * Case-insensitive lookup key for names (Unicode aware, unlike SQLite's NOCASE).
     */
    public static function nameKey(string $name): string
    {
        return mb_strtolower(trim($name));
    }
}
