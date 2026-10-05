<?php

declare(strict_types=1);

namespace App\Service;

use App\Domain\Booking;
use App\Domain\BookingStatus;
use App\Domain\Clock;
use App\Domain\DateRange;
use App\Domain\Exception\ConflictException;
use App\Domain\Exception\NotFoundException;
use App\Domain\Exception\ValidationException;
use App\Domain\Owner;
use App\Domain\Price;
use App\Domain\Slot;
use App\Infrastructure\BookingRepository;
use App\Infrastructure\OwnerRepository;
use App\Infrastructure\SitterRepository;
use App\Infrastructure\Transaction;
use DateTimeImmutable;

final class BookingService
{
    public function __construct(
        private readonly BookingRepository $bookings,
        private readonly OwnerRepository $owners,
        private readonly SitterRepository $sitters,
        private readonly Transaction $transaction,
        private readonly Clock $clock,
    ) {}

    /**
     * @return list<Booking>
     */
    public function list(): array
    {
        return $this->bookings->all();
    }

    public function get(string $id): Booking
    {
        return $this->bookings->find($id) ?? throw new NotFoundException('Betreuung nicht gefunden.');
    }

    /**
     * Creates the booking and, like the form promises, stores the owner's contact
     * details and all mentioned cats on the owner record.
     */
    public function create(CreateBookingCommand $command): Booking
    {
        $ownerName = trim($command->ownerName);
        if ($ownerName === '') {
            throw new ValidationException('Name ist ein Pflichtfeld.');
        }
        if ($command->cats === []) {
            throw new ValidationException('Mindestens eine Katze angeben.');
        }
        $range = DateRange::create($command->from, $command->to);
        $priceCents = Price::eurosToCents($command->price);

        return $this->transaction->run(function () use ($command, $ownerName, $range, $priceCents): Booking {
            $owner = $this->resolveOwner($command->ownerId, $ownerName);
            $this->owners->updateContact($owner->id, $command->address, $command->phone, $command->email);

            $cats = [];
            foreach ($command->cats as $name) {
                $cat = $this->owners->addCat($owner->id, $name);
                $cats[$cat->id] = $cat;
            }

            return $this->bookings->create($owner->id, array_values($cats), $range, $priceCents);
        });
    }

    public function updatePrice(string $id, float $euros): Booking
    {
        $this->requireEditable($id);
        $this->bookings->updatePrice($id, Price::eurosToCents($euros));

        return $this->get($id);
    }

    public function setArchived(string $id, bool $archived): Booking
    {
        $booking = $this->get($id);
        if ($archived && !$booking->archived && $booking->status($this->clock->today()) !== BookingStatus::Ended) {
            throw new ConflictException(sprintf(
                'Archivieren ist erst nach dem %s möglich.',
                (new DateTimeImmutable($booking->range->to))->format('d.m.Y'),
            ));
        }

        $this->bookings->setArchived($id, $archived);

        return $this->get($id);
    }

    /**
     * Assigns a sitter to one visit slot, or clears it when $sitterId is null.
     */
    public function assignVisit(string $id, string $day, string $slot, ?string $sitterId): Booking
    {
        $booking = $this->requireEditable($id);

        $slotValue = Slot::tryFrom($slot) ?? throw new ValidationException('Ungültiger Besuch: erlaubt sind F (Früh) und A (Abend).');
        if (!DateRange::isIsoDate($day) || !$booking->range->contains($day)) {
            throw new ValidationException('Das Datum liegt außerhalb der Betreuung.');
        }

        if ($sitterId === null) {
            $this->bookings->clearVisit($id, $day, $slotValue);
        } else {
            if ($this->sitters->find($sitterId) === null) {
                throw new NotFoundException('Betreuungsperson nicht gefunden.');
            }
            $this->bookings->setVisit($id, $day, $slotValue, $sitterId);
        }

        return $this->get($id);
    }

    private function resolveOwner(?string $ownerId, string $ownerName): Owner
    {
        if ($ownerId !== null) {
            $owner = $this->owners->find($ownerId);
            if ($owner !== null) {
                return $owner;
            }
        }

        return $this->owners->findByName($ownerName) ?? $this->owners->create($ownerName, '', '', '');
    }

    private function requireEditable(string $id): Booking
    {
        $booking = $this->get($id);
        if ($booking->archived) {
            throw new ConflictException('Archivierte Betreuungen können nicht geändert werden.');
        }

        return $booking;
    }
}
