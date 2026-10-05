<?php

declare(strict_types=1);

namespace App\Infrastructure;

use App\Domain\Booking;
use App\Domain\Cat;
use App\Domain\DateRange;
use App\Domain\Slot;
use PDO;

final class BookingRepository
{
    private const BOOKING_COLUMNS = 'id, owner_id, date_from, date_to, price_cents, archived';

    public function __construct(private readonly PDO $pdo) {}

    /**
     * @return list<Booking>
     */
    public function all(): array
    {
        $statement = $this->pdo->query('SELECT ' . self::BOOKING_COLUMNS . ' FROM bookings ORDER BY date_from, rowid');
        if ($statement === false) {
            return [];
        }

        $cats = $this->catsByBooking(null);
        $visits = $this->visitsByBooking(null);

        return array_map(
            static function (array $row) use ($cats, $visits): Booking {
                $id = Row::string($row, 'id');

                return self::map($row, $cats[$id] ?? [], $visits[$id] ?? []);
            },
            Row::all($statement),
        );
    }

    public function find(string $id): ?Booking
    {
        $statement = $this->pdo->prepare('SELECT ' . self::BOOKING_COLUMNS . ' FROM bookings WHERE id = :id');
        $statement->execute(['id' => $id]);
        $row = Row::one($statement);
        if ($row === null) {
            return null;
        }

        return self::map($row, $this->catsByBooking($id)[$id] ?? [], $this->visitsByBooking($id)[$id] ?? []);
    }

    /**
     * @param list<Cat> $cats
     */
    public function create(string $ownerId, array $cats, DateRange $range, int $priceCents): Booking
    {
        $id = Ids::generate();
        $statement = $this->pdo->prepare(
            'INSERT INTO bookings (id, owner_id, date_from, date_to, price_cents, archived)
             VALUES (:id, :owner, :from, :to, :price, 0)',
        );
        $statement->execute([
            'id' => $id,
            'owner' => $ownerId,
            'from' => $range->from,
            'to' => $range->to,
            'price' => $priceCents,
        ]);

        $link = $this->pdo->prepare(
            'INSERT INTO booking_cats (booking_id, cat_id, position) VALUES (:booking, :cat, :position)',
        );
        foreach ($cats as $position => $cat) {
            $link->execute(['booking' => $id, 'cat' => $cat->id, 'position' => $position]);
        }

        return new Booking($id, $ownerId, $cats, $range, $priceCents, false, []);
    }

    public function updatePrice(string $id, int $priceCents): void
    {
        $statement = $this->pdo->prepare('UPDATE bookings SET price_cents = :price WHERE id = :id');
        $statement->execute(['id' => $id, 'price' => $priceCents]);
    }

    public function setArchived(string $id, bool $archived): void
    {
        $statement = $this->pdo->prepare('UPDATE bookings SET archived = :archived WHERE id = :id');
        $statement->execute(['id' => $id, 'archived' => $archived ? 1 : 0]);
    }

    public function setVisit(string $bookingId, string $day, Slot $slot, string $sitterId): void
    {
        $statement = $this->pdo->prepare(
            'INSERT INTO visits (booking_id, day, slot, sitter_id) VALUES (:booking, :day, :slot, :sitter)
             ON CONFLICT (booking_id, day, slot) DO UPDATE SET sitter_id = excluded.sitter_id',
        );
        $statement->execute(['booking' => $bookingId, 'day' => $day, 'slot' => $slot->value, 'sitter' => $sitterId]);
    }

    public function clearVisit(string $bookingId, string $day, Slot $slot): void
    {
        $statement = $this->pdo->prepare(
            'DELETE FROM visits WHERE booking_id = :booking AND day = :day AND slot = :slot',
        );
        $statement->execute(['booking' => $bookingId, 'day' => $day, 'slot' => $slot->value]);
    }

    /**
     * @return array<string, list<Cat>>
     */
    private function catsByBooking(?string $bookingId): array
    {
        $sql = 'SELECT bc.booking_id, c.id, c.owner_id, c.name
                FROM booking_cats bc JOIN cats c ON c.id = bc.cat_id'
            . ($bookingId === null ? '' : ' WHERE bc.booking_id = :booking')
            . ' ORDER BY bc.booking_id, bc.position';
        $statement = $this->pdo->prepare($sql);
        $statement->execute($bookingId === null ? [] : ['booking' => $bookingId]);

        $result = [];
        foreach (Row::all($statement) as $row) {
            $result[Row::string($row, 'booking_id')][] = new Cat(
                Row::string($row, 'id'),
                Row::string($row, 'owner_id'),
                Row::string($row, 'name'),
            );
        }

        return $result;
    }

    /**
     * @return array<string, array<string, string>>
     */
    private function visitsByBooking(?string $bookingId): array
    {
        $sql = 'SELECT booking_id, day, slot, sitter_id FROM visits'
            . ($bookingId === null ? '' : ' WHERE booking_id = :booking')
            . ' ORDER BY day, slot DESC';
        $statement = $this->pdo->prepare($sql);
        $statement->execute($bookingId === null ? [] : ['booking' => $bookingId]);

        $result = [];
        foreach (Row::all($statement) as $row) {
            $key = Row::string($row, 'day') . '|' . Row::string($row, 'slot');
            $result[Row::string($row, 'booking_id')][$key] = Row::string($row, 'sitter_id');
        }

        return $result;
    }

    /**
     * @param array<array-key, mixed> $row
     * @param list<Cat> $cats
     * @param array<string, string> $visits
     */
    private static function map(array $row, array $cats, array $visits): Booking
    {
        return new Booking(
            Row::string($row, 'id'),
            Row::string($row, 'owner_id'),
            $cats,
            DateRange::create(Row::string($row, 'date_from'), Row::string($row, 'date_to')),
            Row::int($row, 'price_cents'),
            Row::int($row, 'archived') === 1,
            $visits,
        );
    }
}
