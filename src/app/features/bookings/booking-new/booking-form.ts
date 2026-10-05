import { daysBetween } from '../../../core/domain/dates';
import { formatEur, parsePrice } from '../../../core/domain/money';

export interface BookingFormValue {
  ownerName: string;
  cats: readonly string[];
  from: string;
  to: string;
  price: string;
}

export interface BookingFormErrors {
  owner?: string;
  cats?: string;
  dates?: string;
  price?: string;
}

export function validateBookingForm(form: BookingFormValue): BookingFormErrors {
  const errors: BookingFormErrors = {};
  if (!form.ownerName.trim()) {
    errors.owner = 'Name ist ein Pflichtfeld.';
  }
  if (form.cats.length === 0) {
    errors.cats = 'Mindestens eine Katze angeben.';
  }
  if (!form.from || !form.to) {
    errors.dates = 'Bitte Beginn und Ende wählen.';
  } else if (form.to < form.from) {
    errors.dates = 'Ende liegt vor dem Beginn.';
  }
  if (parsePrice(form.price) === null) {
    errors.price = 'Bitte einen gültigen Preis angeben.';
  }
  return errors;
}

export interface BookingSummary {
  days: string;
  visits: string;
  max: string;
}

/** Tage | Besuche (= Tage × 2) | Max. (= Besuche × Preis); "–" without a valid range. */
export function bookingSummary(from: string, to: string, price: string): BookingSummary {
  const days = daysBetween(from, to).length;
  if (!days) {
    return { days: '–', visits: '–', max: '–' };
  }
  return {
    days: String(days),
    visits: String(days * 2),
    max: formatEur(days * 2 * (parsePrice(price) ?? 0)),
  };
}
