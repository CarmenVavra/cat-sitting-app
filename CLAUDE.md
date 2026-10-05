# Project Guide: Angular & PHP API Application

This document contains strict rules, guidelines, and commands that Claude MUST follow during development, testing, and automated code reviews.

## 1. System Commands & Workflow

Before finalizing any task, creating a commit, or finishing a review, you must execute verification.

- **Frontend Build & Test:** `npm run build` and `npm run test -- --watch=false`
- **Frontend Lint & Format:** `npm run lint` and `npm run format`
- **Backend Test Suite:** `./vendor/bin/phpunit` (or `./vendor/bin/pest`)
- **Backend Code Quality & Style:** `./vendor/bin/phpstan analyse` and `./vendor/bin/php-cs-fixer fix --dry-run`

CRITICAL: Never commit code that fails any of these steps. If a test or analysis fails, diagnose and fix it autonomously.

## 2. Automated Code Review Checklist

### Angular (Frontend) Guidelines

- **Architecture:** Use standalone components. Enforce strict separation of UI (Components) and Business Logic/State (Services).
- **Reactivity:** Use Angular Signals for local state management. For RxJS, prevent memory leaks using the `async` pipe or `takeUntilDestroyed()`.
- **Typing:** Strict TypeScript is mandatory. Define explicit interfaces for all PHP API response structures.

### PHP (Backend) Guidelines

- **Modern PHP Features:** Use strict typing (`declare(strict_types=1);` at the top of every file). Leverage PHP 8+ features like constructor property promotion, match expressions, and readonly properties.
- **Security & SQL Injection:** Never concatenate variables into SQL strings. Always use PDO or an ORM with prepared statements and bound parameters.
- **Type Hinting:** Every function argument and return value must have explicit type hints. Use `mixed` only if absolutely unavoidable.
- **Error Handling:** Catch structural errors using try/catch blocks. Return clean JSON error responses (`{ "error": "Message" }`) with correct HTTP status codes (400, 401, 403, 404, 500). Never expose raw PHP stack traces.

### General Testing Requirements

- **Frontend:** Write Unit Tests with Jasmine/Karma or Jest for all new services and components.
- **Backend:** Write unit tests using PHPUnit or Pest. Ensure API endpoints are covered by functional/integration tests that mock external service dependencies.

## 3. Naming & Style Conventions

- **Angular:** Follow the official Angular Style Guide (kebab-case for filenames, camelCase for properties).
- **PHP:** Strictly follow PER Coding Style (formerly PSR-12). camelCase for methods/variables, PascalCase for classes.

## 4. Git & Commit Guidelines

- **Format:** Conventional Commits (e.g., `feat(api): add typed response for user profile`, `fix(ui): resolve memory leak in dashboard`).
