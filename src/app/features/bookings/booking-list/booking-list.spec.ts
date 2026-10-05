import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import {
  FakeApi,
  booking,
  createFakeApi,
  provideFakeApi,
  provideFixedClock,
} from '../../../../testing/fixtures';
import { AppStore } from '../../../core/app-store';
import { BookingList } from './booking-list';

describe('BookingList', () => {
  async function setup(api: FakeApi = createFakeApi()) {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideFakeApi(api), provideFixedClock()],
    });
    await TestBed.inject(AppStore).load();
    const fixture = TestBed.createComponent(BookingList);
    await fixture.whenStable();
    return { fixture, el: fixture.nativeElement as HTMLElement };
  }

  const text = (el: Element | null): string => el?.textContent?.replace(/\s+/g, ' ').trim() ?? '';

  it('shows running and planned bookings sorted by start', async () => {
    const { el } = await setup();

    const cards = [...el.querySelectorAll('.booking-card:not(.ended)')];
    expect(cards.map((c) => text(c.querySelector('.cats')))).toEqual(['Minka & Felix', 'Luna']);
    expect(text(cards[0].querySelector('.tag'))).toBe('Läuft');
    expect(cards[0].querySelector('.tag')?.classList).toContain('tag-accent');
    expect(text(cards[1].querySelector('.tag'))).toBe('Geplant');
    expect(text(cards[0].querySelector('.card-bottom span'))).toBe('5 / 16 Besuche');
    expect(text(cards[0].querySelector('.card-bottom b'))).toBe('50,00 €');
    expect(cards[0].querySelector('a')?.getAttribute('href')).toBe('/betreuungen/b1');
  });

  it('lists ended bookings separately and archives them', async () => {
    const api = createFakeApi();
    api.updateBooking.and.returnValue(
      of(
        booking({ id: 'b3', ownerId: 'o3', from: '2026-09-20', to: '2026-09-23', archived: true }),
      ),
    );
    const { fixture, el } = await setup(api);

    const ended = el.querySelector('.booking-card.ended');
    expect(text(ended?.querySelector('.cats') ?? null)).toBe('Tiger');
    expect(text(ended?.querySelector('.tag') ?? null)).toBe('Beendet');

    (ended?.querySelector('.archive-btn') as HTMLButtonElement).click();
    await fixture.whenStable();

    expect(api.updateBooking).toHaveBeenCalledWith('b3', { archived: true });
    expect(el.querySelector('.booking-card.ended')).toBeNull();
  });

  it('shows the empty state', async () => {
    const { el } = await setup(createFakeApi({ bookings: [] }));

    expect(text(el.querySelector('.empty-state'))).toBe(
      'Keine laufenden Betreuungen. Lege mit „Neu“ eine an.',
    );
  });
});
