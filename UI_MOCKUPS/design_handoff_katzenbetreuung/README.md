# Übergabe: Katzenbetreuung – Besuchserfassung & Abrechnung

## Überblick
Mit der App erfasst man Katzenbetreuungen: Pro Betreuung gibt es eine Besitzerin oder einen Besitzer, eine oder mehrere Katzen, einen Zeitraum und einen Preis pro Besuch. Pro Tag gibt es zwei Besuche (Früh und Abend), und jedem Besuch wird eine Betreuungsperson zugeordnet. Die App berechnet daraus, wie viel jede Person bekommt (Anzahl Besuche × Preis) und welcher Gesamtbetrag der Besitzerin verrechnet wird. Es gibt keine Umsatzsteuer. Beendete Betreuungen kann man ins Archiv verschieben.

## Über die Design-Dateien
Die Dateien in diesem Paket sind **Design-Referenzen in HTML**. Sie sind ein klickbarer Prototyp, der Aussehen und Verhalten zeigt, und **kein Produktionscode**. Die Aufgabe ist, das Design in der Zielumgebung neu umzusetzen. Wenn es schon ein Projekt gibt, mit dessen Framework und Mustern. Wenn nicht, mit einem passenden Stack, z. B. React + Vite + TypeScript mit lokaler Persistenz (IndexedDB/SQLite) oder einem kleinen Backend.

Prototyp ansehen: `Katzenbetreuung.dc.html` direkt im Browser öffnen (benötigt `support.js` und den Ordner `_ds/` daneben). Oben schaltet man zwischen Smartphone und Desktop um.

## Fidelity
**High-Fidelity.** Farben, Typografie, Abstände und Interaktionen sind final und sollen möglichst genau nachgebaut werden. Ausnahme sind die Beispieldaten: Sie sind erfunden.

## Grundlayout
- **Mobil (390 × 844):** Header oben, scrollbarer Inhalt, unten eine Tab-Leiste mit 3 gleich breiten Spalten (Betreuungen, Archiv, Einstellungen).
- **Desktop (Referenz 1240 × 780):** links eine Sidebar (232 px) mit Logo-Quadrat (22 × 22, Akzent), Titel „Katzenbetreuung“ (Archivo 800, 20px) und der Navigation als volle Zeilen. Die aktive Zeile ist mit der Akzentfarbe gefüllt und hat Text in der Hintergrundfarbe. Rechts daneben Header und Inhalt. Unten in der Sidebar steht „Heute · Mo 05.10.2026“.
- **Header:** Padding 20/16/14, unten ein 2px-Trenner. Darüber eine Kicker-Zeile (10px, Großbuchstaben, letter-spacing .12em, Akzent, 600), darunter der Titel (Archivo 800, 26px, letter-spacing −.015em, einzeilig mit Ellipsis). Optional links ein Zurück-Icon-Button (36 × 36, `.btn-secondary`), optional rechts der Primär-Button „+ Neu“.
- **Mobile Tab-Leiste:** Icon 20px über dem Label (12px, 600), alles linksbündig. Der aktive Tab hat einen 3px-Balken oben und Akzentfarbe, inaktive Tabs sind neutral-700. Höhe mindestens 60px.

## Screens

### 1. Betreuungen (Übersicht)
- **Abschnitt „Laufend & geplant“:** h6-Label, darunter ein Grid `repeat(auto-fill, minmax(280px,1fr))` mit gap 12. Eine Karte (`.card`, padding 14, gap 10) enthält:
  - Tag „Läuft“ (`.tag-accent`) oder „Geplant“ (`.tag-outline`), rechts der Zeitraum „01.10. – 08.10.2026“ (12px, neutral-700)
  - Katzennamen „Minka & Felix“ (Archivo 800, 19px), darunter der Besitzername (13px)
  - Fortschrittsbalken 4px hoch (Spur neutral-300, Füllung Akzent, Breite = erfasste / alle Besuche)
  - „9 / 16 Besuche“ links, Betrag fett rechts
  - Hover: Hintergrund neutral-300. Ein Klick öffnet die Detailansicht.
- **Abschnitt „Beendet · bereit fürs Archiv“:** steht nach einem 2px-Trenner und erscheint nur, wenn das Enddatum vor heute liegt. Die Karten sind transparent mit 1px-Rahmen und haben den Tag „Beendet“ (`.tag-neutral`) sowie den Button „Ins Archiv“ (`.btn-secondary`, Archiv-Icon). Der Button stoppt das Klick-Event, damit die Karte nicht zusätzlich geöffnet wird.
- **Leerzustand:** gestrichelter Rahmen mit dem Text „Keine laufenden Betreuungen. Lege mit „Neu“ eine an.“
- Sortiert wird nach Startdatum aufsteigend.

### 2. Neue Betreuung
Formular mit max. Breite 560px, padding 16, gap 18. Abschnitte mit h6-Label, getrennt durch 2px-Linien.
- **Katzenbesitzer:in**
  - **Name \*** (Pflicht), Autocomplete-Feld (min-height 44):
    - Beim Tippen erscheint eine Liste gespeicherter Besitzer:innen, deren Name den Text enthält (max. 5). Jede Zeile zeigt den Namen (600, 14px) und darunter die Katzen (12px).
    - Gibt es keinen exakt gleichen Namen (Groß-/Kleinschreibung egal), steht zusätzlich „+ „X“ neu speichern“ in Akzentfarbe in der Liste.
    - **Ein neuer Name wird sofort gespeichert**: beim Verlassen des Feldes (blur), bei Enter oder per Klick auf die Option. Danach erscheint das Tag „Neu gespeichert“.
    - Wird eine bestehende Person gewählt, werden Adresse, Telefon und E-Mail **und alle ihre Katzen** vorausgefüllt. Tag: „Gespeichert · N Katze(n) bekannt“.
    - Die Dropdown-Optionen reagieren auf `mousedown`, damit der Blur des Feldes nicht vorher feuert.
  - **Adresse** (optional, volle Breite), **Telefon** (optional, `tel`), **E-Mail** (optional, `email`). Grid `repeat(auto-fit,minmax(200px,1fr))`.
- **Katzen** (Chip-Eingabe mit Autocomplete):
  - Gewählte Katzen erscheinen als Chips (Akzentfläche, Text in Hintergrundfarbe, 13px 600) mit ×-Button.
  - Vorschläge: zuerst die Katzen der gewählten Besitzerin („von Maria Huber“), dann andere bekannte Katzen („bekannt“), wenn der Text passt. Max. 6.
  - Ein unbekannter Name erscheint als Option „+ „X“ neu speichern“. Hinzugefügte Katzen werden **sofort** bei der Besitzerin gespeichert.
  - Enter oder Komma fügt hinzu. Backspace in einem leeren Feld entfernt den letzten Chip.
- **Zeitraum & Preis:**
  - Von \* / Bis \* (`date`, 2 Spalten). Von ist mit heute vorbelegt.
  - Preis pro Besuch in € (number, step 0.5), vorbelegt mit dem Standardpreis aus den Einstellungen.
  - Zusammenfassung als 3 Spalten (oben 2px-Linie in Textfarbe, Spalten durch 1px getrennt): Tage | Besuche (= Tage × 2) | Max. (= Besuche × Preis).
- **Buttons:** „Betreuung speichern“ (primär, flex 1, Label linksbündig, min-height 48) und „Abbrechen“ (sekundär).
- **Validierung** beim Speichern, Fehler stehen unter dem Feld (12px, accent-700):
  - Name fehlt: „Name ist ein Pflichtfeld.“
  - Keine Katze: „Mindestens eine Katze angeben.“
  - Datum fehlt: „Bitte Beginn und Ende wählen.“
  - Ende vor Beginn: „Ende liegt vor dem Beginn.“
- **Nach dem Speichern:** Kontaktdaten und Katzen werden bei der Besitzerin aktualisiert, die neue Betreuung wird angelegt und die Detailansicht öffnet sich.

### 3. Detail: Besuchsplan + Abrechnung
- **Header:** Kicker = Name der Besitzerin (bei archivierten Betreuungen mit „· Archiv“), Titel = Katzennamen.
- **Infoleiste** (Grid `auto-fit,minmax(180px,1fr)`, unten 2px-Trenner):
  - Zeitraum (nowrap)
  - Preis / Besuch als kleines Number-Feld (72px). **Der Preis ist pro Betreuung editierbar** und wird sofort auf die Abrechnung angewendet. Bei archivierten Betreuungen ist das Feld deaktiviert.
  - Darunter eine Zeile mit Name, Adresse, Telefon und E-Mail (nur vorhandene Werte).
- **Mobil:** ein Segment-Umschalter (`.seg`, volle Breite) „Besuchsplan | Abrechnung“.
- **Desktop:** beide Bereiche nebeneinander (`1.15fr | 1fr`), die Abrechnung mit 2px-Linie links.

**Besuchsplan:**
- Kopfzeile „Wer war wann da?“ (h6) und rechts „9 / 16 erfasst“ (nowrap). Darunter der Hinweis „Tippe auf Früh oder Abend, um die Betreuungsperson zu wählen.“
- Liste mit 2px-Linie oben. Pro Tag eine Zeile: Grid `72px | 1fr | 1fr`, gap 6, padding 6/0, unten 1px-Linie.
  - **Datumsspalte:** Wochentag (800, 15px), darunter „05.10.“ (12px). Am heutigen Tag zusätzlich „HEUTE“ (10px, Akzent), und die ganze Zeile bekommt den Hintergrund accent-100.
  - **Slot-Button** (min-height 48, linksbündig): oben das Label „FRÜH“ / „ABEND“ (10px, Großbuchstaben), darunter der Name (600, 14px, Ellipsis). Zustände:
    - Zugeordnet: gefüllt in der Personenfarbe (siehe Tokens), durchgezogener Rahmen
    - Vergangen und nicht zugeordnet: Text „offen“, gestrichelter Rahmen accent-400, Text accent-700
    - Zukünftig und nicht zugeordnet: „—“, gestrichelter Rahmen in Trennerfarbe, Text neutral-600
    - „Vergangen“ heißt: Datum < heute, oder heute und Früh.
  - Ein Klick öffnet die **Personenauswahl** (Bottom-Sheet auf Mobil, zentriert auf Desktop, Overlay neutral-900 mit 50 %):
    - Kicker mit Datum und Slot, z. B. „Mo 05.10.2026 · Abend“, Titel „Wer war bei der Katze?“
    - Pro Person ein Button in voller Breite (aktuelle Person `.btn-primary`, sonst `.btn-secondary`) mit Farbquadrat 12px und linksbündigem Namen
    - Ghost-Button „Niemand / nicht erfasst“ entfernt die Zuordnung
    - Unten das Feld „Neue Person (Vorname)“ mit dem Button „Anlegen“: legt die Person an und ordnet sie dem Slot direkt zu. Bei mehreren Wörtern wird das erste zum Vornamen, der Rest zum Nachnamen.
    - Ein Klick auf das Overlay schließt die Auswahl.

**Abrechnung:**
- **Gesamtblock** (Akzentfläche, Text in Hintergrundfarbe, padding 16):
  - „AN MARIA HUBER VERRECHNEN“ (11px, Großbuchstaben)
  - Betrag (Archivo 800, 40px)
  - „N Besuche × 10,00 €“ (13px)
- **Hinweise:**
  - Gibt es vergangene, nicht zugeordnete Slots, erscheint die Box „N vergangene Besuche ohne Betreuungsperson – bitte nachtragen.“ (accent-100 Fläche, accent-300 Rahmen, accent-700 Text).
  - Gibt es noch zukünftige Slots: „Noch N Besuche geplant. Betrag ist vorläufig.“
- **Pro Person** (h6): jede Person, die mindestens einen Besuch hat, als Block mit 2px-Linie in Textfarbe oben:
  - Farbquadrat 14px, Name (800, 17px), darunter „N Besuche × Preis“ (12px)
  - rechts der Betrag (Archivo 800, 22px)
  - darunter alle Besuche als Grid `auto-fill,minmax(118px,1fr)`: „Do 01.10. · Früh“ (12px)
- **Aktionen:**
  - „Ins Archiv verschieben“ (nur wenn beendet und nicht archiviert; danach Wechsel zum Archiv)
  - „Aus Archiv wiederherstellen“ (nur bei archivierten Betreuungen)
  - sonst der Hinweis „Archivieren ist nach dem 08.10.2026 möglich.“
- **Archivierte Betreuungen** sind nur lesbar: Slots deaktiviert, Preisfeld deaktiviert.

### 4. Archiv
- Liste mit 2px-Linie oben, Zeilen mit 1px-Trennlinie. Jede Zeile ist ein 2-spaltiges Grid:
  - links Katzen (800, 16px), darunter „Besitzer · Zeitraum“ (12px)
  - rechts der Betrag (800, 16px), darunter „N Besuche“
- Hover: neutral-200. Ein Klick öffnet die Detailansicht im Lesemodus.
- Unten „Summe Archiv“ mit dem Gesamtbetrag. Sortiert wird nach Startdatum absteigend.
- Leerzustand: „Das Archiv ist leer.“

### 5. Einstellungen
- **Standardpreis:** Number-Feld „Pro Besuch (€)“ mit dem Hinweis „Vorschlag für neue Betreuungen. Bestehende behalten ihren Preis.“
- **Betreuungspersonen:**
  - Liste mit Farbquadrat, Name, „N Besuche“ und dem Ghost-Button „Entfernen“. Der Button ist deaktiviert, sobald die Person Besuche hat, damit bestehende Abrechnungen erhalten bleiben.
  - Darunter das Formular Vorname \* | Nachname | „Hinzufügen“. Fehlt der Vorname: „Vorname ist ein Pflichtfeld.“
- **Gespeicherte Besitzer:innen:** Name, Katzen und Kontakt (oder „Keine Kontaktdaten“). Nur Anzeige; Bearbeiten/Löschen könnte man später ergänzen.
- „Demo-Daten zurücksetzen“ gibt es nur im Prototyp und wird in der App weggelassen.

## Datenmodell
```ts
type Sitter  = { id: string; first: string; last?: string };             // Vorname Pflicht
type Owner   = { id: string; name: string; address?: string; phone?: string; email?: string; cats: string[] };
type Booking = {
  id: string; ownerId: string;
  cats: string[];              // Teilmenge/Erweiterung von owner.cats
  from: string; to: string;    // ISO-Datum YYYY-MM-DD, inklusive
  price: number;               // € pro Besuch, pro Betreuung festgelegt
  archived: boolean;
  visits: Record<`${string}|${'F'|'A'}`, string>; // "2026-10-05|F" -> sitterId
};
type Settings = { defaultPrice: number };  // Standard 10
```
Wichtig: Katzen und Besitzer:innen sind eigene, wiederverwendbare Datensätze (für das Autocomplete). Im Prototyp sind Katzen nur Strings am Owner. In der echten App kann man sie als eigene Entität `Cat { id, ownerId, name }` anlegen.

## Rechenregeln
- Slots pro Betreuung = Anzahl Tage (inklusive) × 2.
- Betrag pro Person = Anzahl ihrer zugeordneten Slots × `booking.price`.
- Gesamtbetrag = Summe aller zugeordneten Slots × `booking.price`. Keine Steuern.
- Status: `to < heute` → Beendet; `from > heute` → Geplant; sonst → Läuft.
- Archivieren ist nur erlaubt, wenn der Status „Beendet“ ist. Wiederherstellen ist jederzeit möglich.
- Geldformat: `de-DE` EUR, z. B. „90,00 €“. Datumsformat „05.10.“ bzw. „05.10.2026“, Wochentage kurz „Mo, Di …“.
- Im Prototyp ist „heute“ fest auf 2026-10-05 gesetzt. In der App wird das echte Datum verwendet.

## State (UI)
`view` (list | new | detail | archive | settings), `section` (aktiver Navigationspunkt, bestimmt das Ziel von „Zurück“), `detailId`, `detailTab` (plan | bill, nur mobil), `picker` ({bookingId, slotKey} | null), Formularzustand plus Fehler, Fokus- und Querystatus der Autocomplete-Felder. Der Prototyp speichert alles in localStorage (`katzenbetreuung-v1`); die App sollte echte Persistenz verwenden.

## Design-Tokens (Modernist-Designsystem, Akzent ersetzt)
Die Basis ist `_ds/.../styles.css` (Modernist). **Die Akzentfarbe wird überschrieben** mit der Hauptfarbe **#970747**:
- Akzent-Ramp: 100 `#fbeef3` · 200 `#f5d7e3` · 300 `#e9b3c9` · 400 `#d27aa1` · 500 `#b23a6c` · **Basis `#970747`** · 600 (Hover) `#7d053a` · 700 (Pressed/Text) `#64042e` · 800 `#4d0323` · 900 `#330217`
- Hintergrund `#f3f2f2`, Fläche (Karten/Inputs) `#eae9e9`, Text `#201e1d`, Trenner = Text mit 40 % Deckkraft
- Neutral-Ramp: 100 `#f8f4f4` · 200 `#eae7e7` · 300 `#d7d3d3` · 400 `#bab6b6` · 500 `#9b9797` · 600 `#7d7979` · 700 `#605d5d` · 800 `#444141` · 900 `#2d2b2b`
- **Personenfarben** (nach Reihenfolge der Personen, zyklisch):
  1. Akzent mit hellem Text
  2. Textfarbe `#201e1d` mit hellem Text
  3. accent-300 mit accent-900-Text
  4. neutral-400 mit neutral-900-Text
- **Schrift:** Archivo (Google Fonts, 400/600/800) für alles. Überschriften 800 mit letter-spacing −.015em. Größen: h1 42 · h2 32 · h3 25 · h4 20 · h6 13 (Großbuchstaben, .08em). Body 15/1.55, Inputs und Buttons 14.
- **Abstände:** 4 · 8 · 12 · 16 · 24 · 32
- **Radius:** überall **0** (keine runden Ecken)
- **Schatten:** sm `0 1px 2px rgba(45,43,43,.14)` · md `0 3px 10px rgba(45,43,43,.16)` · lg `0 12px 32px rgba(45,43,43,.22)`
- **Linien:** 2px zwischen Hauptbereichen, 1px zwischen Zeilen
- **Buttons:** Labels immer linksbündig. Primär: Akzentfläche, Hover 600, Pressed 700. Disabled: 45 % Deckkraft. Fokus: 2px-Outline in Akzentfarbe mit 2px Abstand.
- **Touch-Ziele mobil:** mindestens 44px

## Assets
Es gibt keine Bilder. Die Icons sind Lucide (calendar-days, archive, sliders-horizontal, chevron-left, plus, x), mit Strichstärke 2.

## Dateien
- `Katzenbetreuung.dc.html` – der gesamte Prototyp. Der Markup-Teil enthält Template und Inline-Styles, die Klasse `Component` enthält die komplette Logik (Seed-Daten, Rechenregeln, Autocomplete).
- `support.js` – Runtime, nur damit der Prototyp im Browser läuft; für die Implementierung nicht relevant.
- `_ds/modernist-…/styles.css` – Tokens und Komponentenklassen des Designsystems (`.btn`, `.input`, `.field`, `.seg`, `.card`, `.tag` …).
