<?php

declare(strict_types=1);

$finder = (new PhpCsFixer\Finder())
    ->in([__DIR__ . '/api'])
    ->exclude(['var'])
    ->append([__FILE__]);

return (new PhpCsFixer\Config())
    ->setRiskyAllowed(true)
    ->setRules([
        '@PER-CS3.0' => true,
        '@PER-CS3.0:risky' => true,
        'declare_strict_types' => true,
        'no_unused_imports' => true,
        'ordered_imports' => ['imports_order' => ['class', 'function', 'const'], 'sort_algorithm' => 'alpha'],
        'strict_comparison' => true,
        'strict_param' => true,
    ])
    ->setFinder($finder)
    ->setCacheFile(__DIR__ . '/api/var/.php-cs-fixer.cache');
