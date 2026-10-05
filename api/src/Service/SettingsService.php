<?php

declare(strict_types=1);

namespace App\Service;

use App\Domain\Price;
use App\Infrastructure\SettingsRepository;

final class SettingsService
{
    public function __construct(private readonly SettingsRepository $settings) {}

    public function defaultPrice(): float
    {
        return Price::centsToEuros($this->settings->defaultPriceCents());
    }

    public function setDefaultPrice(float $euros): float
    {
        $this->settings->setDefaultPriceCents(Price::eurosToCents($euros));

        return $this->defaultPrice();
    }
}
