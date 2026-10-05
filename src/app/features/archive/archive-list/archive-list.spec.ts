import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import {
  booking,
  createFakeApi,
  provideFakeApi,
  provideFixedClock,
} from '../../../../testing/fixtures';
import { AppStore } from '../../../core/app-store';
import { ArchiveList } from './archive-list';

describe('ArchiveList', () => {
  async function setup(api = createFakeApi()) {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideFakeApi(api), provideFixedClock()],
    });
    await TestBed.inject(AppStore).load();
    const fixture = TestBed.createComponent(ArchiveList);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('lists archived bookings newest first with their total', async () => {
    const api = createFakeApi({
      bookings: [
        booking({
          id: 'a1',
          from: '2026-08-10',
          to: '2026-08-11',
          archived: true,
          price: 9,
          visits: { '2026-08-10|F': 's1', '2026-08-10|A': 's2' },
        }),
        booking({
          id: 'a2',
          from: '2026-09-01',
          to: '2026-09-02',
          archived: true,
          visits: { '2026-09-01|F': 's1' },
        }),
        booking({ id: 'live' }),
      ],
    });
    const el = await setup(api);

    const rows = [...el.querySelectorAll('.row')];
    expect(rows.map((r) => r.getAttribute('href'))).toEqual(['/archiv/a2', '/archiv/a1']);
    expect(rows[0].querySelector('.meta')?.textContent).toContain(
      'Maria Huber · 01.09. – 02.09.2026',
    );
    expect(rows[0].querySelector('.amount')?.textContent).toBe('10,00 €');
    // a2: 1 × 10 € + a1: 2 × 9 €
    expect(el.querySelector('.sum b')?.textContent).toBe('28,00 €');
  });

  it('shows the empty state', async () => {
    const el = await setup(createFakeApi({ bookings: [] }));

    expect(el.querySelector('.empty-state')?.textContent).toBe('Das Archiv ist leer.');
    expect(el.querySelector('.sum')).toBeNull();
  });
});
