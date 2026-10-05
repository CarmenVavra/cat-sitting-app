<?php

declare(strict_types=1);

namespace App\Service;

use App\Domain\Exception\ConflictException;
use App\Domain\Exception\NotFoundException;
use App\Domain\Exception\ValidationException;
use App\Domain\Sitter;
use App\Infrastructure\SitterRepository;

final class SitterService
{
    public function __construct(private readonly SitterRepository $sitters) {}

    /**
     * @return list<Sitter>
     */
    public function list(): array
    {
        return $this->sitters->all();
    }

    public function create(string $first, string $last): Sitter
    {
        $first = trim($first);
        if ($first === '') {
            throw new ValidationException('Vorname ist ein Pflichtfeld.');
        }

        return $this->sitters->create($first, trim($last));
    }

    /**
     * Sitters with recorded visits stay, so existing billings remain intact.
     */
    public function delete(string $id): void
    {
        if ($this->sitters->find($id) === null) {
            throw new NotFoundException('Betreuungsperson nicht gefunden.');
        }
        if ($this->sitters->visitCount($id) > 0) {
            throw new ConflictException('Personen mit erfassten Besuchen können nicht entfernt werden.');
        }

        $this->sitters->delete($id);
    }
}
