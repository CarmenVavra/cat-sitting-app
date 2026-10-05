<?php

declare(strict_types=1);

namespace App;

use App\Controller\BookingController;
use App\Controller\OwnerController;
use App\Controller\SettingsController;
use App\Controller\SitterController;
use App\Domain\Clock;
use App\Domain\Exception\ConflictException;
use App\Domain\Exception\NotFoundException;
use App\Domain\Exception\ValidationException;
use App\Http\HttpException;
use App\Http\JsonResponse;
use App\Http\Request;
use App\Http\Router;
use App\Infrastructure\BookingRepository;
use App\Infrastructure\OwnerRepository;
use App\Infrastructure\SettingsRepository;
use App\Infrastructure\SitterRepository;
use App\Infrastructure\Transaction;
use App\Service\BookingService;
use App\Service\OwnerService;
use App\Service\SettingsService;
use App\Service\SitterService;
use Closure;
use PDO;
use Throwable;

final class Application
{
    /**
     * @param Closure(Throwable): void $logError
     */
    public function __construct(
        private readonly Router $router,
        private readonly Closure $logError,
    ) {}

    /**
     * Wires repositories, services and routes. The database must already be migrated.
     *
     * @param (Closure(Throwable): void)|null $logError defaults to error_log()
     */
    public static function create(PDO $pdo, Clock $clock, ?Closure $logError = null): self
    {
        $transaction = new Transaction($pdo);
        $sitterRepository = new SitterRepository($pdo);
        $ownerRepository = new OwnerRepository($pdo);

        $settings = new SettingsController(new SettingsService(new SettingsRepository($pdo)));
        $sitters = new SitterController(new SitterService($sitterRepository));
        $owners = new OwnerController(new OwnerService($ownerRepository, $transaction));
        $bookings = new BookingController(new BookingService(
            new BookingRepository($pdo),
            $ownerRepository,
            $sitterRepository,
            $transaction,
            $clock,
        ));

        $router = new Router();
        $router->add('GET', '/api/settings', static fn(): JsonResponse => $settings->show());
        $router->add('PUT', '/api/settings', static fn(Request $r): JsonResponse => $settings->update($r));

        $router->add('GET', '/api/sitters', static fn(): JsonResponse => $sitters->list());
        $router->add('POST', '/api/sitters', static fn(Request $r): JsonResponse => $sitters->create($r));
        $router->add('DELETE', '/api/sitters/{id}', static fn(Request $r, array $p): JsonResponse => $sitters->delete($p['id']));

        $router->add('GET', '/api/owners', static fn(): JsonResponse => $owners->list());
        $router->add('POST', '/api/owners', static fn(Request $r): JsonResponse => $owners->create($r));
        $router->add('POST', '/api/owners/{id}/cats', static fn(Request $r, array $p): JsonResponse => $owners->addCat($r, $p['id']));

        $router->add('GET', '/api/bookings', static fn(): JsonResponse => $bookings->list());
        $router->add('POST', '/api/bookings', static fn(Request $r): JsonResponse => $bookings->create($r));
        $router->add('GET', '/api/bookings/{id}', static fn(Request $r, array $p): JsonResponse => $bookings->show($p['id']));
        $router->add('PATCH', '/api/bookings/{id}', static fn(Request $r, array $p): JsonResponse => $bookings->update($r, $p['id']));
        $router->add(
            'PUT',
            '/api/bookings/{id}/visits/{day}/{slot}',
            static fn(Request $r, array $p): JsonResponse => $bookings->assignVisit($r, $p['id'], $p['day'], $p['slot']),
        );
        $router->add(
            'DELETE',
            '/api/bookings/{id}/visits/{day}/{slot}',
            static fn(Request $r, array $p): JsonResponse => $bookings->clearVisit($p['id'], $p['day'], $p['slot']),
        );

        return new self($router, $logError ?? static function (Throwable $e): void {
            error_log((string) $e);
        });
    }

    /**
     * Never throws: every failure becomes a clean `{ "error": "..." }` response.
     */
    public function handle(Request $request): JsonResponse
    {
        try {
            return $this->router->dispatch($request);
        } catch (HttpException $e) {
            return JsonResponse::error($e->getMessage(), $e->status);
        } catch (ValidationException $e) {
            return JsonResponse::error($e->getMessage(), 400);
        } catch (NotFoundException $e) {
            return JsonResponse::error($e->getMessage(), 404);
        } catch (ConflictException $e) {
            return JsonResponse::error($e->getMessage(), 409);
        } catch (Throwable $e) {
            ($this->logError)($e);

            return JsonResponse::error('Interner Serverfehler.', 500);
        }
    }
}
