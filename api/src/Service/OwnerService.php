<?php

declare(strict_types=1);

namespace App\Service;

use App\Domain\Exception\NotFoundException;
use App\Domain\Exception\ValidationException;
use App\Domain\Owner;
use App\Infrastructure\OwnerRepository;
use App\Infrastructure\Transaction;

final class OwnerService
{
    public function __construct(
        private readonly OwnerRepository $owners,
        private readonly Transaction $transaction,
    ) {}

    /**
     * @return list<Owner>
     */
    public function list(): array
    {
        return $this->owners->all();
    }

    /**
     * Saves a new owner. If an owner with the same name (case-insensitive) exists,
     * that owner is returned unchanged and `created` is false.
     *
     * @param list<string> $cats
     * @return array{owner: Owner, created: bool}
     */
    public function create(string $name, string $address, string $phone, string $email, array $cats): array
    {
        $name = trim($name);
        if ($name === '') {
            throw new ValidationException('Name ist ein Pflichtfeld.');
        }

        $existing = $this->owners->findByName($name);
        if ($existing !== null) {
            return ['owner' => $existing, 'created' => false];
        }

        $owner = $this->transaction->run(function () use ($name, $address, $phone, $email, $cats): Owner {
            $owner = $this->owners->create($name, $address, $phone, $email);
            foreach ($cats as $cat) {
                $this->owners->addCat($owner->id, $cat);
            }

            return $this->requireOwner($owner->id);
        });

        return ['owner' => $owner, 'created' => true];
    }

    public function addCat(string $ownerId, string $name): Owner
    {
        $name = trim($name);
        if ($name === '') {
            throw new ValidationException('Katzenname ist ein Pflichtfeld.');
        }

        $this->requireOwner($ownerId);
        $this->owners->addCat($ownerId, $name);

        return $this->requireOwner($ownerId);
    }

    private function requireOwner(string $id): Owner
    {
        return $this->owners->find($id) ?? throw new NotFoundException('Besitzer:in nicht gefunden.');
    }
}
