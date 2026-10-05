/**
 * Calendar-day helpers. Dates are ISO strings (YYYY-MM-DD) and are handled in UTC
 * internally so that daylight saving changes never shift a day.
 */

const WEEKDAYS = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'] as const;
const DAY_MS = 86_400_000;
const MAX_DAYS = 400;

const pad2 = (n: number): string => String(n).padStart(2, '0');

export function parseIso(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function toIso(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** The local calendar date of `now` as ISO string. */
export function localIsoDate(now: Date = new Date()): string {
  return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
}

/** All days from `from` to `to` (inclusive). Empty when a date is missing or the range is inverted. */
export function daysBetween(from: string, to: string): string[] {
  const out: string[] = [];
  if (!from || !to) {
    return out;
  }
  const end = parseIso(to).getTime();
  for (let t = parseIso(from).getTime(); t <= end && out.length < MAX_DAYS; t += DAY_MS) {
    out.push(toIso(new Date(t)));
  }
  return out;
}

/** "05.10." */
export function formatDayMonth(iso: string): string {
  const d = parseIso(iso);
  return `${pad2(d.getUTCDate())}.${pad2(d.getUTCMonth() + 1)}.`;
}

/** "05.10.2026" */
export function formatFullDate(iso: string): string {
  return formatDayMonth(iso) + parseIso(iso).getUTCFullYear();
}

/** "Mo" */
export function weekdayShort(iso: string): string {
  return WEEKDAYS[parseIso(iso).getUTCDay()];
}

/** "01.10. – 08.10.2026" */
export function formatRange(from: string, to: string): string {
  return `${formatDayMonth(from)} – ${formatFullDate(to)}`;
}
