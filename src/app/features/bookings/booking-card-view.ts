import {
  BookingStatus,
  STATUS_LABEL,
  bookingStats,
  bookingStatus,
  catsLine,
} from '../../core/domain/booking-calc';
import { formatRange } from '../../core/domain/dates';
import { formatEur } from '../../core/domain/money';
import { Booking, Owner } from '../../core/models/api.models';

/** Display data for a booking in the overview and the archive. */
export interface BookingCardView {
  id: string;
  cats: string;
  owner: string;
  range: string;
  status: BookingStatus;
  statusLabel: string;
  done: number;
  total: number;
  /** progress 0–100 */
  pct: number;
  amount: string;
}

export function toBookingCard(
  booking: Booking,
  owner: Owner | undefined,
  today: string,
): BookingCardView {
  const stats = bookingStats(booking);
  const status = bookingStatus(booking, today);
  return {
    id: booking.id,
    cats: catsLine(booking.cats.map((c) => c.name)),
    owner: owner?.name ?? '?',
    range: formatRange(booking.from, booking.to),
    status,
    statusLabel: STATUS_LABEL[status],
    done: stats.done,
    total: stats.total,
    pct: stats.total ? Math.round((stats.done / stats.total) * 100) : 0,
    amount: formatEur(stats.amount),
  };
}
