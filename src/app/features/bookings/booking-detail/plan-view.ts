import {
  SLOTS,
  SLOT_LABEL,
  isPastSlot,
  sitterColor,
  sitterName,
  visitKey,
} from '../../../core/domain/booking-calc';
import { daysBetween, formatDayMonth, weekdayShort } from '../../../core/domain/dates';
import { Booking, Sitter, VisitKey } from '../../../core/models/api.models';

export type SlotState = 'assigned' | 'open' | 'future';

export interface PlanSlot {
  key: VisitKey;
  label: string;
  /** sitter name, "offen" (past, unassigned) or "—" (future, unassigned) */
  name: string;
  state: SlotState;
  bg: string | null;
  fg: string | null;
}

export interface PlanDay {
  date: string;
  weekday: string;
  dayMonth: string;
  isToday: boolean;
  slots: PlanSlot[];
}

export function planDays(booking: Booking, sitters: readonly Sitter[], today: string): PlanDay[] {
  return daysBetween(booking.from, booking.to).map((date) => ({
    date,
    weekday: weekdayShort(date),
    dayMonth: formatDayMonth(date),
    isToday: date === today,
    slots: SLOTS.map((slot): PlanSlot => {
      const key = visitKey(date, slot);
      const sitterId = booking.visits[key];
      if (sitterId) {
        const color = sitterColor(sitters, sitterId);
        return {
          key,
          label: SLOT_LABEL[slot],
          name: sitterName(sitters.find((s) => s.id === sitterId)),
          state: 'assigned',
          bg: color.bg,
          fg: color.fg,
        };
      }
      const past = isPastSlot(date, slot, today);
      return {
        key,
        label: SLOT_LABEL[slot],
        name: past ? 'offen' : '—',
        state: past ? 'open' : 'future',
        bg: null,
        fg: null,
      };
    }),
  }));
}
