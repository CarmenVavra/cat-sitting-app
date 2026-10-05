<?php

declare(strict_types=1);

namespace App\Controller;

use App\Domain\Sitter;
use App\Http\Input;
use App\Http\JsonResponse;
use App\Http\Request;
use App\Service\SitterService;

final class SitterController
{
    public function __construct(private readonly SitterService $sitters) {}

    public function list(): JsonResponse
    {
        return new JsonResponse(array_map(static fn(Sitter $s): array => $s->toArray(), $this->sitters->list()));
    }

    public function create(Request $request): JsonResponse
    {
        $input = new Input($request->json());
        $sitter = $this->sitters->create($input->optionalString('first'), $input->optionalString('last'));

        return new JsonResponse($sitter->toArray(), 201);
    }

    public function delete(string $id): JsonResponse
    {
        $this->sitters->delete($id);

        return JsonResponse::noContent();
    }
}
