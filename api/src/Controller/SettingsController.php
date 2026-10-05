<?php

declare(strict_types=1);

namespace App\Controller;

use App\Http\Input;
use App\Http\JsonResponse;
use App\Http\Request;
use App\Service\SettingsService;

final class SettingsController
{
    public function __construct(private readonly SettingsService $settings) {}

    public function show(): JsonResponse
    {
        return new JsonResponse(['defaultPrice' => $this->settings->defaultPrice()]);
    }

    public function update(Request $request): JsonResponse
    {
        $input = new Input($request->json());

        return new JsonResponse(['defaultPrice' => $this->settings->setDefaultPrice($input->number('defaultPrice'))]);
    }
}
