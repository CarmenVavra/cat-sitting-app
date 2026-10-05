<?php

declare(strict_types=1);

namespace App\Infrastructure;

use Closure;
use PDO;
use Throwable;

final class Transaction
{
    public function __construct(private readonly PDO $pdo) {}

    /**
     * @template T
     * @param Closure(): T $work
     * @return T
     */
    public function run(Closure $work): mixed
    {
        $this->pdo->beginTransaction();
        try {
            $result = $work();
            $this->pdo->commit();

            return $result;
        } catch (Throwable $e) {
            $this->pdo->rollBack();

            throw $e;
        }
    }
}
