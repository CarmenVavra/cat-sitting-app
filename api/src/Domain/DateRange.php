<?php

declare(strict_types=1);

namespace App\Domain;

use App\Domain\Exception\ValidationException;
use DateTimeImmutable;

/**
 * Inclusive range of calendar days, stored as ISO dates (YYYY-MM-DD).
 */
final class DateRange
{
    public const MAX_DAYS = 366;

    private function __construct(
        public readonly string $from,
        public readonly string $to,
    ) {}

    /**
     * @throws ValidationException with a user-facing German message
     */
    public static function create(string $from, string $to): self
    {
        if (!self::isIsoDate($from) || !self::isIsoDate($to)) {
            throw new ValidationException('Bitte Beginn und Ende wählen.');
        }
        if ($to < $from) {
            throw new ValidationException('Ende liegt vor dem Beginn.');
        }

        $range = new self($from, $to);
        if ($range->dayCount() > self::MAX_DAYS) {
            throw new ValidationException(sprintf('Eine Betreuung darf höchstens %d Tage dauern.', self::MAX_DAYS));
        }

        return $range;
    }

    public static function isIsoDate(string $value): bool
    {
        $date = DateTimeImmutable::createFromFormat('!Y-m-d', $value);

        return $date !== false && $date->format('Y-m-d') === $value;
    }

    public function dayCount(): int
    {
        $from = new DateTimeImmutable($this->from);
        $to = new DateTimeImmutable($this->to);

        return (int) $from->diff($to)->days + 1;
    }

    public function contains(string $day): bool
    {
        return $day >= $this->from && $day <= $this->to;
    }
}
