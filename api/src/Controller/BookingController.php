<?php

declare(strict_types=1);

namespace App\Controller;

use App\Domain\Booking;
use App\Http\HttpException;
use App\Http\Input;
use App\Http\JsonResponse;
use App\Http\Request;
use App\Service\BookingService;
use App\Service\CreateBookingCommand;

final class BookingController
{
    public function __construct(private readonly BookingService $bookings) {}

    public function list(): JsonResponse
    {
        return new JsonResponse(array_map(static fn(Booking $b): array => $b->toArray(), $this->bookings->list()));
    }

    public function show(string $id): JsonResponse
    {
        return new JsonResponse($this->bookings->get($id)->toArray());
    }

    public function create(Request $request): JsonResponse
    {
        $input = new Input($request->json());
        $booking = $this->bookings->create(new CreateBookingCommand(
            ownerId: $input->nullableString('ownerId'),
            ownerName: $input->optionalString('ownerName'),
            address: $input->optionalString('address'),
            phone: $input->optionalString('phone'),
            email: $input->optionalString('email'),
            cats: $input->stringList('cats'),
            from: $input->optionalString('from'),
            to: $input->optionalString('to'),
            price: $input->number('price'),
        ));

        return new JsonResponse($booking->toArray(), 201);
    }

    /**
     * Partial update: `price` (number) and/or `archived` (bool).
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $input = new Input($request->json());
        if (!$input->has('price') && !$input->has('archived')) {
            throw HttpException::badRequest('Nichts zu ändern: "price" oder "archived" angeben.');
        }

        $booking = $this->bookings->get($id);
        if ($input->has('archived')) {
            $booking = $this->bookings->setArchived($id, $input->bool('archived'));
        }
        if ($input->has('price')) {
            $booking = $this->bookings->updatePrice($id, $input->number('price'));
        }

        return new JsonResponse($booking->toArray());
    }

    public function assignVisit(Request $request, string $id, string $day, string $slot): JsonResponse
    {
        $input = new Input($request->json());
        $sitterId = $input->requiredString('sitterId', 'Feld "sitterId" fehlt.');

        return new JsonResponse($this->bookings->assignVisit($id, $day, $slot, $sitterId)->toArray());
    }

    public function clearVisit(string $id, string $day, string $slot): JsonResponse
    {
        return new JsonResponse($this->bookings->assignVisit($id, $day, $slot, null)->toArray());
    }
}
