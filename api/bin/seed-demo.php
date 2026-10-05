<?php

declare(strict_types=1);

/*
 * Fills an EMPTY database with the example data from the design prototype,
 * shifted relative to today. Usage: php api/bin/seed-demo.php
 */

use App\Domain\SystemClock;
use App\Infrastructure\BookingRepository;
use App\Infrastructure\Database;
use App\Infrastructure\OwnerRepository;
use App\Infrastructure\SitterRepository;
use App\Infrastructure\Transaction;
use App\Service\BookingService;
use App\Service\CreateBookingCommand;

require dirname(__DIR__, 2) . '/vendor/autoload.php';

date_default_timezone_set('Europe/Vienna');

$envPath = getenv('KATZEN_DB_PATH');
$dbPath = is_string($envPath) && $envPath !== '' ? $envPath : dirname(__DIR__) . '/var/katzenbetreuung.sqlite';
if (!is_dir(dirname($dbPath))) {
    mkdir(dirname($dbPath), 0o775, true);
}

$pdo = Database::connect('sqlite:' . $dbPath);
Database::migrate($pdo);

$count = $pdo->query('SELECT COUNT(*) FROM bookings');
if ($count !== false && (int) $count->fetchColumn() > 0) {
    fwrite(STDERR, "Die Datenbank enthält bereits Betreuungen – Demo-Daten werden nicht eingespielt.\n");
    exit(1);
}

$clock = new SystemClock(new DateTimeZone('Europe/Vienna'));
$today = new DateTimeImmutable($clock->today());
$day = static fn(int $offset): string => $today->modify(sprintf('%+d days', $offset))->format('Y-m-d');

$sitters = new SitterRepository($pdo);
$owners = new OwnerRepository($pdo);
$bookingRepository = new BookingRepository($pdo);
$service = new BookingService($bookingRepository, $owners, $sitters, new Transaction($pdo), $clock);

$anna = $sitters->create('Anna', 'Weber');
$lukas = $sitters->create('Lukas', '');

$owners->create('Maria Huber', 'Lindengasse 12, 1070 Wien', '+43 664 123 45 67', 'maria.huber@mail.at');
$owners->create('Thomas Berger', '', '+43 699 555 01 02', '');
$owners->create('Sabine Leitner', 'Hauptstraße 4, 3400 Klosterneuburg', '', 's.leitner@gmx.at');

$book = static function (string $owner, int $from, int $to, float $price, string ...$cats) use ($service, $owners, $day): string {
    $o = $owners->findByName($owner);

    return $service->create(new CreateBookingCommand(
        $o?->id,
        $owner,
        $o->address ?? '',
        $o->phone ?? '',
        $o->email ?? '',
        array_values($cats),
        $day($from),
        $day($to),
        $price,
    ))->id;
};

$fill = static function (string $bookingId, int $from, int $to, Closure $pick, bool $untilToday) use ($service, $day): void {
    for ($i = 0; $i <= $to - $from; $i++) {
        foreach (['F', 'A'] as $j => $slot) {
            $offset = $from + $i;
            if ($untilToday && ($offset > 0 || ($offset === 0 && $slot === 'A'))) {
                return;
            }
            $sitterId = $pick($i, $j);
            if (is_string($sitterId)) {
                $service->assignVisit($bookingId, $day($offset), $slot, $sitterId);
            }
        }
    }
};

$running = $book('Maria Huber', -4, 3, 10, 'Minka', 'Felix');
$fill($running, -4, 3, static fn(int $i, int $j): ?string => ($i === 2 && $j === 1) ? null : (($i + $j) % 3 === 2 ? $lukas->id : $anna->id), true);

$book('Thomas Berger', 7, 10, 12, 'Luna');

$ended = $book('Sabine Leitner', -15, -12, 10, 'Mausi', 'Tiger', 'Grauli');
$fill($ended, -15, -12, static fn(int $i, int $j): string => $j === 1 ? $lukas->id : $anna->id, false);

$archived = $book('Maria Huber', -56, -50, 9, 'Minka', 'Felix');
$fill($archived, -56, -50, static fn(int $i, int $j): string => $i < 4 ? $anna->id : $lukas->id, false);
$service->setArchived($archived, true);

echo "Demo-Daten eingespielt: {$dbPath}\n";
