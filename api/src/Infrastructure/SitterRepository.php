<?php

declare(strict_types=1);

namespace App\Infrastructure;

use App\Domain\Sitter;
use PDO;

final class SitterRepository
{
    public function __construct(private readonly PDO $pdo) {}

    /**
     * Ordered by creation; the position determines the sitter's colour in the UI.
     *
     * @return list<Sitter>
     */
    public function all(): array
    {
        $statement = $this->pdo->query('SELECT id, first_name, last_name FROM sitters ORDER BY rowid');

        return $statement === false ? [] : array_map(self::map(...), Row::all($statement));
    }

    public function find(string $id): ?Sitter
    {
        $statement = $this->pdo->prepare('SELECT id, first_name, last_name FROM sitters WHERE id = :id');
        $statement->execute(['id' => $id]);
        $row = Row::one($statement);

        return $row === null ? null : self::map($row);
    }

    public function create(string $first, string $last): Sitter
    {
        $sitter = new Sitter(Ids::generate(), $first, $last);
        $statement = $this->pdo->prepare('INSERT INTO sitters (id, first_name, last_name) VALUES (:id, :first, :last)');
        $statement->execute(['id' => $sitter->id, 'first' => $first, 'last' => $last]);

        return $sitter;
    }

    public function delete(string $id): void
    {
        $statement = $this->pdo->prepare('DELETE FROM sitters WHERE id = :id');
        $statement->execute(['id' => $id]);
    }

    public function visitCount(string $id): int
    {
        $statement = $this->pdo->prepare('SELECT COUNT(*) AS n FROM visits WHERE sitter_id = :id');
        $statement->execute(['id' => $id]);
        $row = Row::one($statement);

        return $row === null ? 0 : Row::int($row, 'n');
    }

    /**
     * @param array<array-key, mixed> $row
     */
    private static function map(array $row): Sitter
    {
        return new Sitter(Row::string($row, 'id'), Row::string($row, 'first_name'), Row::string($row, 'last_name'));
    }
}
