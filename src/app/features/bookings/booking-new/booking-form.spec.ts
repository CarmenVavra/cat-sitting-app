import { bookingSummary, validateBookingForm } from './booking-form';

describe('booking-form', () => {
  const valid = {
    ownerName: 'Maria',
    cats: ['Minka'],
    from: '2026-10-01',
    to: '2026-10-08',
    price: '10',
  };

  it('accepts a complete form', () => {
    expect(validateBookingForm(valid)).toEqual({});
  });

  it('reports every missing field with the texts from the design', () => {
    expect(
      validateBookingForm({ ownerName: ' ', cats: [], from: '2026-10-01', to: '', price: '' }),
    ).toEqual({
      owner: 'Name ist ein Pflichtfeld.',
      cats: 'Mindestens eine Katze angeben.',
      dates: 'Bitte Beginn und Ende wählen.',
      price: 'Bitte einen gültigen Preis angeben.',
    });
  });

  it('rejects an end before the start', () => {
    expect(validateBookingForm({ ...valid, to: '2026-09-30' }).dates).toBe(
      'Ende liegt vor dem Beginn.',
    );
  });

  it('summarises days, visits and maximum amount', () => {
    expect(bookingSummary('2026-10-01', '2026-10-08', '10')).toEqual({
      days: '8',
      visits: '16',
      max: '160,00 €',
    });
    expect(bookingSummary('2026-10-01', '', '10')).toEqual({ days: '–', visits: '–', max: '–' });
  });
});
