const EUR = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' });

/** "90,00 €" (de-DE, with a non-breaking space before the sign). */
export function formatEur(amount: number): string {
  return EUR.format(amount || 0);
}

/**
 * Parses a price typed by the user ("12,5" or "12.5").
 * Returns null for empty, invalid or negative input.
 */
export function parsePrice(raw: string): number | null {
  const trimmed = raw.trim();
  if (trimmed === '') {
    return null;
  }
  const value = Number(trimmed.replace(',', '.'));
  return Number.isFinite(value) && value >= 0 ? value : null;
}
