<?php

declare(strict_types=1);

namespace App\Controller;

use App\Domain\Owner;
use App\Http\Input;
use App\Http\JsonResponse;
use App\Http\Request;
use App\Service\OwnerService;

final class OwnerController
{
    public function __construct(private readonly OwnerService $owners) {}

    public function list(): JsonResponse
    {
        return new JsonResponse(array_map(static fn(Owner $o): array => $o->toArray(), $this->owners->list()));
    }

    /**
     * 201 for a new owner, 200 when an owner with that name already existed.
     */
    public function create(Request $request): JsonResponse
    {
        $input = new Input($request->json());
        $result = $this->owners->create(
            $input->optionalString('name'),
            $input->optionalString('address'),
            $input->optionalString('phone'),
            $input->optionalString('email'),
            $input->stringList('cats'),
        );

        return new JsonResponse($result['owner']->toArray(), $result['created'] ? 201 : 200);
    }

    public function addCat(Request $request, string $ownerId): JsonResponse
    {
        $input = new Input($request->json());

        return new JsonResponse($this->owners->addCat($ownerId, $input->optionalString('name'))->toArray());
    }
}
