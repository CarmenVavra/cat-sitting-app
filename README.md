# Katzenbetreuung

App zum Erfassen von Katzenbetreuungen: Besitzer:in, Katzen, Zeitraum und Preis pro Besuch. Pro Tag gibt es zwei Besuche (Früh/Abend), jedem Besuch wird eine Betreuungsperson zugeordnet. Die App berechnet, was jede Person bekommt und was der Besitzerin verrechnet wird. Beendete Betreuungen wandern ins Archiv.

Design-Vorlage: [`UI_MOCKUPS/design_handoff_katzenbetreuung`](UI_MOCKUPS/design_handoff_katzenbetreuung/README.md)

## Starten & Stoppen (Windows)

| Datei       | Wirkung                                                                                                          |
| ----------- | ---------------------------------------------------------------------------------------------------------------- |
| `start.bat` | startet die PHP-API auf **http://localhost:8400** und die App auf **http://localhost:4250** (öffnet den Browser) |
| `stop.bat`  | beendet beide Server                                                                                             |

Beim ersten Start werden fehlende Abhängigkeiten (`composer install`, `npm install`) automatisch installiert.

Voraussetzungen: PHP ≥ 8.2 mit `pdo_sqlite`, Composer, Node.js ≥ 22.12.

Manuell (zwei Terminals):

```bash
npm run api
```

```bash
npm start
```

## Daten

- Gespeichert in SQLite: `api/var/katzenbetreuung.sqlite` (wird beim ersten Request automatisch angelegt). Pfad über die Umgebungsvariable `KATZEN_DB_PATH` änderbar.
- **Alles löschen:** Server stoppen und die Datei `api/var/katzenbetreuung.sqlite` löschen.
- **Demo-Daten** (nur in eine leere Datenbank): `npm run seed:demo`

## Aufbau

```
api/                    PHP-JSON-API (ohne Framework)
  public/index.php      Einstiegspunkt
  src/Domain/           Modelle & Regeln (Status, Zeitraum, Preis in Cent)
  src/Service/          Geschäftslogik (Archivieren nur wenn beendet, Archiv nur lesbar …)
  src/Infrastructure/   PDO-Repositories (nur Prepared Statements), Schema
  src/Controller/       HTTP-Controller
  tests/                PHPUnit: Unit- und funktionale Endpunkt-Tests (In-Memory-SQLite, feste Uhr)
src/app/                Angular 21 (standalone, Signals, zoneless)
  core/                 API-Client, AppStore (State), Clock, Rechenregeln, Autocomplete-Regeln
  features/             Seiten: Betreuungen, Neue Betreuung, Detail, Archiv, Einstellungen
  shared/               Icon, Page-Header
```

### API

| Methode      | Pfad                                            | Zweck                                                           |
| ------------ | ----------------------------------------------- | --------------------------------------------------------------- |
| GET / PUT    | `/api/settings`                                 | Standardpreis                                                   |
| GET / POST   | `/api/sitters`                                  | Betreuungspersonen                                              |
| DELETE       | `/api/sitters/{id}`                             | entfernen (409, wenn Besuche vorhanden)                         |
| GET / POST   | `/api/owners`                                   | Besitzer:innen (POST liefert bei gleichem Namen die bestehende) |
| POST         | `/api/owners/{id}/cats`                         | Katze hinzufügen                                                |
| GET / POST   | `/api/bookings`                                 | Betreuungen                                                     |
| GET / PATCH  | `/api/bookings/{id}`                            | Detail, `price` / `archived` ändern                             |
| PUT / DELETE | `/api/bookings/{id}/visits/{YYYY-MM-DD}/{F\|A}` | Besuch zuordnen (`{ "sitterId" }`) / entfernen                  |

Fehler kommen immer als `{ "error": "Meldung" }` mit passendem Statuscode (400, 404, 405, 409, 500).

## Prüfen

```bash
npm run build
```

```bash
npm run test -- --watch=false
```

```bash
npm run lint
```

```bash
npm run format
```

```bash
./vendor/bin/phpunit
```

```bash
./vendor/bin/phpstan analyse
```

```bash
./vendor/bin/php-cs-fixer fix --dry-run
```
