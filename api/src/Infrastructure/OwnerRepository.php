<?php

declare(strict_types=1);

namespace App\Infrastructure;

use App\Domain\Cat;
use App\Domain\Owner;
use PDO;

final class OwnerRepository
{
    private const OWNER_COLUMNS = 'id, name, address, phone, email';

    public function __construct(private readonly PDO $pdo) {}

    /**
     * @return list<Owner>
     */
    public function all(): array
    {
        $statement = $this->pdo->query('SELECT ' . self::OWNER_COLUMNS . ' FROM owners ORDER BY rowid');
        if ($statement === false) {
            return [];
        }

        $catsByOwner = [];
        foreach ($this->allCats() as $cat) {
            $catsByOwner[$cat->ownerId][] = $cat;
        }

        return array_map(
            static fn(array $row): Owner => self::map($row, $catsByOwner[Row::string($row, 'id')] ?? []),
            Row::all($statement),
        );
    }

    public function find(string $id): ?Owner
    {
        $statement = $this->pdo->prepare('SELECT ' . self::OWNER_COLUMNS . ' FROM owners WHERE id = :id');
        $statement->execute(['id' => $id]);
        $row = Row::one($statement);

        return $row === null ? null : self::map($row, $this->cats($id));
    }

    /**
     * Case-insensitive lookup.
     */
    public function findByName(string $name): ?Owner
    {
        $statement = $this->pdo->prepare('SELECT ' . self::OWNER_COLUMNS . ' FROM owners WHERE name_key = :key');
        $statement->execute(['key' => Database::nameKey($name)]);
        $row = Row::one($statement);

        return $row === null ? null : self::map($row, $this->cats(Row::string($row, 'id')));
    }

    public function create(string $name, string $address, string $phone, string $email): Owner
    {
        $id = Ids::generate();
        $statement = $this->pdo->prepare(
            'INSERT INTO owners (id, name, name_key, address, phone, email)
             VALUES (:id, :name, :key, :address, :phone, :email)',
        );
        $statement->execute([
            'id' => $id,
            'name' => $name,
            'key' => Database::nameKey($name),
            'address' => $address,
            'phone' => $phone,
            'email' => $email,
        ]);

        return new Owner($id, $name, $address, $phone, $email, []);
    }

    public function updateContact(string $id, string $address, string $phone, string $email): void
    {
        $statement = $this->pdo->prepare(
            'UPDATE owners SET address = :address, phone = :phone, email = :email WHERE id = :id',
        );
        $statement->execute(['id' => $id, 'address' => $address, 'phone' => $phone, 'email' => $email]);
    }

    /**
     * Adds a cat to the owner unless a cat with the same name (case-insensitive) exists.
     * Returns the stored cat in both cases.
     */
    public function addCat(string $ownerId, string $name): Cat
    {
        $statement = $this->pdo->prepare(
            'SELECT id, owner_id, name FROM cats WHERE owner_id = :owner AND name_key = :key',
        );
        $statement->execute(['owner' => $ownerId, 'key' => Database::nameKey($name)]);
        $existing = Row::one($statement);
        if ($existing !== null) {
            return self::mapCat($existing);
        }

        $cat = new Cat(Ids::generate(), $ownerId, $name);
        $insert = $this->pdo->prepare(
            'INSERT INTO cats (id, owner_id, name, name_key) VALUES (:id, :owner, :name, :key)',
        );
        $insert->execute(['id' => $cat->id, 'owner' => $ownerId, 'name' => $name, 'key' => Database::nameKey($name)]);

        return $cat;
    }

    /**
     * @return list<Cat>
     */
    private function cats(string $ownerId): array
    {
        $statement = $this->pdo->prepare('SELECT id, owner_id, name FROM cats WHERE owner_id = :owner ORDER BY rowid');
        $statement->execute(['owner' => $ownerId]);

        return array_map(self::mapCat(...), Row::all($statement));
    }

    /**
     * @return list<Cat>
     */
    private function allCats(): array
    {
        $statement = $this->pdo->query('SELECT id, owner_id, name FROM cats ORDER BY rowid');

        return $statement === false ? [] : array_map(self::mapCat(...), Row::all($statement));
    }

    /**
     * @param array<array-key, mixed> $row
     * @param list<Cat> $cats
     */
    private static function map(array $row, array $cats): Owner
    {
        return new Owner(
            Row::string($row, 'id'),
            Row::string($row, 'name'),
            Row::string($row, 'address'),
            Row::string($row, 'phone'),
            Row::string($row, 'email'),
            $cats,
        );
    }

    /**
     * @param array<array-key, mixed> $row
     */
    private static function mapCat(array $row): Cat
    {
        return new Cat(Row::string($row, 'id'), Row::string($row, 'owner_id'), Row::string($row, 'name'));
    }
}
