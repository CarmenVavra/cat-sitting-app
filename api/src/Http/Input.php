<?php

declare(strict_types=1);

namespace App\Http;

/**
 * Typed accessors for a decoded JSON body. Every violation becomes a 400 response.
 */
final class Input
{
    private const MAX_TEXT_LENGTH = 200;

    /**
     * @param array<string, mixed> $data
     */
    public function __construct(private readonly array $data) {}

    public function has(string $key): bool
    {
        return array_key_exists($key, $this->data);
    }

    public function requiredString(string $key, string $message): string
    {
        $value = $this->optionalString($key);
        if ($value === '') {
            throw HttpException::badRequest($message);
        }

        return $value;
    }

    /**
     * Returns the trimmed string, or '' when the key is missing or null.
     */
    public function optionalString(string $key): string
    {
        $value = $this->data[$key] ?? null;
        if ($value === null) {
            return '';
        }
        if (!is_string($value)) {
            throw HttpException::badRequest(sprintf('Feld "%s" muss ein Text sein.', $key));
        }

        $value = trim($value);
        if (mb_strlen($value) > self::MAX_TEXT_LENGTH) {
            throw HttpException::badRequest(sprintf('Feld "%s" ist zu lang (max. %d Zeichen).', $key, self::MAX_TEXT_LENGTH));
        }

        return $value;
    }

    public function nullableString(string $key): ?string
    {
        $value = $this->optionalString($key);

        return $value === '' ? null : $value;
    }

    public function number(string $key): float
    {
        $value = $this->data[$key] ?? null;
        if (!is_int($value) && !is_float($value)) {
            throw HttpException::badRequest(sprintf('Feld "%s" muss eine Zahl sein.', $key));
        }

        return (float) $value;
    }

    public function bool(string $key): bool
    {
        $value = $this->data[$key] ?? null;
        if (!is_bool($value)) {
            throw HttpException::badRequest(sprintf('Feld "%s" muss true oder false sein.', $key));
        }

        return $value;
    }

    /**
     * @return list<string> trimmed, non-empty entries
     */
    public function stringList(string $key): array
    {
        $value = $this->data[$key] ?? [];
        if (!is_array($value) || !array_is_list($value)) {
            throw HttpException::badRequest(sprintf('Feld "%s" muss eine Liste sein.', $key));
        }

        $result = [];
        foreach ($value as $item) {
            if (!is_string($item)) {
                throw HttpException::badRequest(sprintf('Feld "%s" darf nur Texte enthalten.', $key));
            }
            $item = trim($item);
            if ($item === '') {
                continue;
            }
            if (mb_strlen($item) > self::MAX_TEXT_LENGTH) {
                throw HttpException::badRequest(sprintf('Eintrag in "%s" ist zu lang.', $key));
            }
            $result[] = $item;
        }

        return $result;
    }
}
