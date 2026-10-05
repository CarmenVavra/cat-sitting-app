<?php

declare(strict_types=1);

namespace App\Domain\Exception;

use RuntimeException;

/**
 * A referenced record does not exist. Maps to HTTP 404.
 */
final class NotFoundException extends RuntimeException {}
