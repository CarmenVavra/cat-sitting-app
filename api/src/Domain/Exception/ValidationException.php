<?php

declare(strict_types=1);

namespace App\Domain\Exception;

use InvalidArgumentException;

/**
 * Invalid input. The message is user-facing (German) and maps to HTTP 400.
 */
final class ValidationException extends InvalidArgumentException {}
