<?php

declare(strict_types=1);

use App\Application;
use App\Domain\SystemClock;
use App\Http\JsonResponse;
use App\Http\Request;
use App\Infrastructure\Database;

require dirname(__DIR__, 2) . '/vendor/autoload.php';

// Never leak PHP warnings or stack traces into the JSON output.
ini_set('display_errors', '0');

const TIME_ZONE = 'Europe/Vienna';
date_default_timezone_set(TIME_ZONE);

try {
    $envPath = getenv('KATZEN_DB_PATH');
    $dbPath = is_string($envPath) && $envPath !== '' ? $envPath : dirname(__DIR__) . '/var/katzenbetreuung.sqlite';
    if (!is_dir(dirname($dbPath))) {
        mkdir(dirname($dbPath), 0o775, true);
    }

    $pdo = Database::connect('sqlite:' . $dbPath);
    Database::migrate($pdo);

    $app = Application::create($pdo, new SystemClock(new DateTimeZone(TIME_ZONE)));
    $app->handle(Request::fromGlobals())->send();
} catch (Throwable $e) {
    error_log((string) $e);
    JsonResponse::error('Interner Serverfehler.', 500)->send();
}
