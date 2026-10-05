<?php

declare(strict_types=1);

namespace App\Domain\Exception;

use RuntimeException;

/**
 * The action is not allowed in the record's current state. Maps to HTTP 409.
 */
final class ConflictException extends RuntimeException {}
