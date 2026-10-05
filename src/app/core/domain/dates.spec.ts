import {
  daysBetween,
  formatDayMonth,
  formatFullDate,
  formatRange,
  localIsoDate,
  weekdayShort,
} from './dates';

describe('dates', () => {
  it('lists all days inclusive', () => {
    expect(daysBetween('2026-10-01', '2026-10-03')).toEqual([
      '2026-10-01',
      '2026-10-02',
      '2026-10-03',
    ]);
    expect(daysBetween('2026-10-05', '2026-10-05')).toEqual(['2026-10-05']);
  });

  it('is not confused by the daylight saving change', () => {
    expect(daysBetween('2026-10-24', '2026-10-26').length).toBe(3);
    expect(daysBetween('2026-03-28', '2026-03-30').length).toBe(3);
  });

  it('returns no days for missing or inverted ranges', () => {
    expect(daysBetween('', '2026-10-03')).toEqual([]);
    expect(daysBetween('2026-10-03', '')).toEqual([]);
    expect(daysBetween('2026-10-03', '2026-10-01')).toEqual([]);
  });

  it('formats dates the German way', () => {
    expect(formatDayMonth('2026-10-05')).toBe('05.10.');
    expect(formatFullDate('2026-10-05')).toBe('05.10.2026');
    expect(weekdayShort('2026-10-05')).toBe('Mo');
    expect(weekdayShort('2026-10-04')).toBe('So');
    expect(formatRange('2026-10-01', '2026-10-08')).toBe('01.10. – 08.10.2026');
  });

  it('uses the local calendar date for today', () => {
    expect(localIsoDate(new Date(2026, 9, 5, 23, 59))).toBe('2026-10-05');
    expect(localIsoDate(new Date(2026, 0, 1, 0, 0))).toBe('2026-01-01');
  });
});
