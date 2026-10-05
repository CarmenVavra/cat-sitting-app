import { Booking, SlotCode, Sitter, VisitKey } from '../models/api.models';
import { daysBetween, formatDayMonth, weekdayShort } from './dates';

/** Calculation rules from the design handoff ("Rechenregeln"). */

export type BookingStatus = 'running' | 'planned' | 'ended';

export const STATUS_LABEL: Record<BookingStatus, string> = {
  running: 'Läuft',
  planned: 'Geplant',
  ended: 'Beendet',
};

export const SLOTS: readonly SlotCode[] = ['F', 'A'];

export const SLOT_LABEL: Record<SlotCode, string> = { F: 'Früh', A: 'Abend' };

export function bookingStatus(booking: Pick<Booking, 'from' | 'to'>, today: string): BookingStatus {
  if (booking.to < today) {
    return 'ended';
  }
  return booking.from > today ? 'planned' : 'running';
}

export function visitKey(day: string, slot: SlotCode): VisitKey {
  return `${day}|${slot}`;
}

export function parseVisitKey(key: VisitKey): { day: string; slot: SlotCode } {
  const [day, slot] = key.split('|') as [string, SlotCode];
  return { day, slot };
}

/** A slot lies in the past if its day is before today, or it is today's morning visit. */
export function isPastSlot(day: string, slot: SlotCode, today: string): boolean {
  return day < today || (day === today && slot === 'F');
}

export interface BookingStats {
  /** all slots: days × 2 */
  total: number;
  /** slots with a sitter */
  done: number;
  /** done × price */
  amount: number;
}

export function bookingStats(booking: Booking): BookingStats {
  const total = daysBetween(booking.from, booking.to).length * 2;
  const done = Object.values(booking.visits).filter(Boolean).length;
  return { total, done, amount: done * booking.price };
}

/** "Minka", "Minka & Felix", "Mausi, Tiger & Grauli" */
export function catsLine(names: readonly string[]): string {
  if (names.length <= 1) {
    return names[0] ?? '–';
  }
  return `${names.slice(0, -1).join(', ')} & ${names[names.length - 1]}`;
}

export function sitterName(sitter: Sitter | undefined): string {
  if (!sitter) {
    return 'Unbekannt';
  }
  return sitter.last ? `${sitter.first} ${sitter.last}` : sitter.first;
}

export interface SitterColor {
  bg: string;
  fg: string;
}

/** Person colours, assigned cyclically by the sitter's position. */
export const SITTER_COLORS: readonly SitterColor[] = [
  { bg: 'var(--color-accent)', fg: 'var(--color-bg)' },
  { bg: 'var(--color-text)', fg: 'var(--color-bg)' },
  { bg: 'var(--color-accent-300)', fg: 'var(--color-accent-900)' },
  { bg: 'var(--color-neutral-400)', fg: 'var(--color-neutral-900)' },
];

export function colorAt(index: number): SitterColor {
  return SITTER_COLORS[(index < 0 ? 3 : index) % SITTER_COLORS.length];
}

export function sitterColor(sitters: readonly Sitter[], sitterId: string): SitterColor {
  return colorAt(sitters.findIndex((s) => s.id === sitterId));
}

/** Number of recorded visits of one sitter across all bookings. */
export function sitterVisitCount(bookings: readonly Booking[], sitterId: string): number {
  return bookings.reduce(
    (sum, b) => sum + Object.values(b.visits).filter((id) => id === sitterId).length,
    0,
  );
}

export interface PersonBill {
  sitterId: string;
  name: string;
  color: string;
  count: number;
  amount: number;
  /** "Do 01.10. · Früh" */
  visits: string[];
}

export interface BillSummary {
  total: number;
  done: number;
  people: PersonBill[];
  /** past slots without a sitter */
  openPast: number;
  /** slots still to come */
  future: number;
}

export function billSummary(
  booking: Booking,
  sitters: readonly Sitter[],
  today: string,
): BillSummary {
  const bySitter = new Map<string, VisitKey[]>();
  let openPast = 0;
  let future = 0;

  for (const day of daysBetween(booking.from, booking.to)) {
    for (const slot of SLOTS) {
      const key = visitKey(day, slot);
      const sitterId = booking.visits[key];
      if (sitterId) {
        bySitter.set(sitterId, [...(bySitter.get(sitterId) ?? []), key]);
      } else if (isPastSlot(day, slot, today)) {
        openPast++;
      } else {
        future++;
      }
    }
  }

  const position = (id: string): number => {
    const i = sitters.findIndex((s) => s.id === id);
    return i < 0 ? Number.MAX_SAFE_INTEGER : i;
  };

  const people = [...bySitter.entries()]
    .sort(([a], [b]) => position(a) - position(b))
    .map(([sitterId, keys]) => ({
      sitterId,
      name: sitterName(sitters.find((s) => s.id === sitterId)),
      color: sitterColor(sitters, sitterId).bg,
      count: keys.length,
      amount: keys.length * booking.price,
      visits: keys.map((key) => {
        const { day, slot } = parseVisitKey(key);
        return `${weekdayShort(day)} ${formatDayMonth(day)} · ${SLOT_LABEL[slot]}`;
      }),
    }));

  const done = people.reduce((sum, p) => sum + p.count, 0);
  return { total: done * booking.price, done, people, openPast, future };
}
