import { SITTERS, TODAY, booking } from '../../../testing/fixtures';
import {
  billSummary,
  bookingStats,
  bookingStatus,
  catsLine,
  colorAt,
  isPastSlot,
  sitterColor,
  sitterName,
  sitterVisitCount,
} from './booking-calc';

describe('booking-calc', () => {
  it('derives the status from today', () => {
    expect(bookingStatus({ from: '2026-09-20', to: '2026-10-04' }, TODAY)).toBe('ended');
    expect(bookingStatus({ from: '2026-10-01', to: '2026-10-05' }, TODAY)).toBe('running');
    expect(bookingStatus({ from: '2026-10-06', to: '2026-10-08' }, TODAY)).toBe('planned');
  });

  it('treats earlier days and today morning as past', () => {
    expect(isPastSlot('2026-10-04', 'A', TODAY)).toBeTrue();
    expect(isPastSlot(TODAY, 'F', TODAY)).toBeTrue();
    expect(isPastSlot(TODAY, 'A', TODAY)).toBeFalse();
    expect(isPastSlot('2026-10-06', 'F', TODAY)).toBeFalse();
  });

  it('computes slots, visits and amount', () => {
    expect(bookingStats(booking())).toEqual({ total: 16, done: 5, amount: 50 });
  });

  it('joins cat names', () => {
    expect(catsLine([])).toBe('–');
    expect(catsLine(['Luna'])).toBe('Luna');
    expect(catsLine(['Minka', 'Felix'])).toBe('Minka & Felix');
    expect(catsLine(['Mausi', 'Tiger', 'Grauli'])).toBe('Mausi, Tiger & Grauli');
  });

  it('names and colours sitters by position', () => {
    expect(sitterName(SITTERS[0])).toBe('Anna Weber');
    expect(sitterName(SITTERS[1])).toBe('Lukas');
    expect(sitterName(undefined)).toBe('Unbekannt');
    expect(sitterColor(SITTERS, 's1').bg).toBe('var(--color-accent)');
    expect(sitterColor(SITTERS, 's2').bg).toBe('var(--color-text)');
    expect(colorAt(4)).toBe(colorAt(0));
    expect(sitterColor(SITTERS, 'unknown').bg).toBe('var(--color-neutral-400)');
  });

  it('counts visits per sitter across bookings', () => {
    expect(sitterVisitCount([booking(), booking({ id: 'b2' })], 's1')).toBe(8);
    expect(sitterVisitCount([booking()], 's2')).toBe(1);
  });

  describe('billSummary', () => {
    it('bills per person in sitter order with all their visits', () => {
      const bill = billSummary(booking(), SITTERS, TODAY);

      expect(bill.total).toBe(50);
      expect(bill.done).toBe(5);
      expect(bill.people.map((p) => [p.name, p.count, p.amount])).toEqual([
        ['Anna Weber', 4, 40],
        ['Lukas', 1, 10],
      ]);
      expect(bill.people[0].visits).toEqual([
        'Do 01.10. · Früh',
        'Do 01.10. · Abend',
        'Fr 02.10. · Früh',
        'Mo 05.10. · Früh',
      ]);
    });

    it('counts open past slots and future slots', () => {
      const bill = billSummary(booking(), SITTERS, TODAY);

      // 01.–05.10. morning = 9 past slots, 5 assigned → 4 open; 05.10. evening–08.10. = 7 future
      expect(bill.openPast).toBe(4);
      expect(bill.future).toBe(7);
    });

    it('uses the booking price', () => {
      expect(billSummary(booking({ price: 12.5 }), SITTERS, TODAY).total).toBe(62.5);
    });
  });
});
