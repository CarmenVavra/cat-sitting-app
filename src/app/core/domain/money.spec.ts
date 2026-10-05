import { formatEur, parsePrice } from './money';

describe('money', () => {
  it('formats euros in de-DE', () => {
    expect(formatEur(90)).toBe('90,00 €');
    expect(formatEur(1234.5)).toBe('1.234,50 €');
    expect(formatEur(0)).toBe('0,00 €');
  });

  it('parses prices with comma or dot', () => {
    expect(parsePrice('12,5')).toBe(12.5);
    expect(parsePrice(' 9.5 ')).toBe(9.5);
    expect(parsePrice('0')).toBe(0);
  });

  it('rejects empty, invalid and negative prices', () => {
    expect(parsePrice('')).toBeNull();
    expect(parsePrice('abc')).toBeNull();
    expect(parsePrice('-1')).toBeNull();
  });
});
