import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import {
  FakeApi,
  booking,
  createFakeApi,
  provideFakeApi,
  provideFixedClock,
} from '../../../../testing/fixtures';
import { AppStore } from '../../../core/app-store';
import { BookingDetail } from './booking-detail';

describe('BookingDetail', () => {
  let api: FakeApi;
  let fixture: ComponentFixture<BookingDetail>;
  let el: HTMLElement;

  async function setup(id: string, section: 'list' | 'archive' = 'list'): Promise<void> {
    api = createFakeApi();
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideFakeApi(api), provideFixedClock()],
    });
    await TestBed.inject(AppStore).load();
    fixture = TestBed.createComponent(BookingDetail);
    fixture.componentRef.setInput('id', id);
    fixture.componentRef.setInput('section', section);
    await fixture.whenStable();
    el = fixture.nativeElement as HTMLElement;
  }

  it('shows owner, cats, period, price and contact', async () => {
    await setup('b1');

    expect(el.querySelector('.kicker')?.textContent).toBe('Maria Huber');
    expect(el.querySelector('h1')?.textContent).toBe('Minka & Felix');
    expect(el.querySelector('[aria-label="Zurück"]')?.getAttribute('href')).toBe('/betreuungen');
    expect(el.querySelector('.range-cell .info-value')?.textContent).toBe('01.10. – 08.10.2026');
    expect((el.querySelector('#booking-price') as HTMLInputElement).value).toBe('10');
    expect([...el.querySelectorAll('.contact-item')].map((c) => c.textContent)).toEqual([
      'Lindengasse 12, 1070 Wien',
      '+43 664 123 45 67',
      'maria.huber@mail.at',
    ]);
  });

  it('switches between plan and billing', async () => {
    await setup('b1');
    const grid = el.querySelector('.detail-grid') as HTMLElement;
    expect(grid.classList).not.toContain('show-bill');

    const billRadio = el.querySelectorAll<HTMLInputElement>('input[name="detail-tab"]')[1];
    billRadio.checked = true;
    billRadio.dispatchEvent(new Event('change'));
    await fixture.whenStable();

    expect(grid.classList).toContain('show-bill');
  });

  it('assigns a sitter through the picker', async () => {
    await setup('b1');
    api.assignVisit.and.returnValue(
      of(booking({ visits: { ...booking().visits, '2026-10-03|A': 's2' } })),
    );

    (el.querySelectorAll('.slot')[5] as HTMLButtonElement).click();
    await fixture.whenStable();
    expect(el.querySelector('app-sitter-picker .sub')?.textContent).toBe('Sa 03.10.2026 · Abend');

    (el.querySelectorAll('app-sitter-picker .option')[1] as HTMLButtonElement).click();
    await fixture.whenStable();

    expect(api.assignVisit).toHaveBeenCalledWith('b1', '2026-10-03', 'A', 's2');
    expect(el.querySelector('app-sitter-picker')).toBeNull();
    expect(el.querySelectorAll('.slot')[5].textContent).toContain('Lukas');
  });

  it('creates a new sitter from the picker and assigns the slot', async () => {
    await setup('b1');
    api.createSitter.and.returnValue(of({ id: 's3', first: 'Mia', last: 'Sommer' }));
    api.assignVisit.and.returnValue(of(booking()));

    (el.querySelectorAll('.slot')[5] as HTMLButtonElement).click();
    await fixture.whenStable();
    const input = el.querySelector('#picker-new') as HTMLInputElement;
    input.value = 'Mia Sommer';
    input.dispatchEvent(new Event('input'));
    el.querySelector('app-sitter-picker form')?.dispatchEvent(
      new Event('submit', { cancelable: true }),
    );
    await fixture.whenStable();

    expect(api.createSitter).toHaveBeenCalledWith({ first: 'Mia', last: 'Sommer' });
    expect(api.assignVisit).toHaveBeenCalledWith('b1', '2026-10-03', 'A', 's3');
  });

  it('updates the price immediately', async () => {
    await setup('b1');
    const input = el.querySelector('#booking-price') as HTMLInputElement;
    input.value = '12';
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();

    expect(el.querySelector('app-billing-panel .total-amount')?.textContent).toBe('60,00 €');
  });

  it('is read-only for archived bookings and can restore them', async () => {
    await setup('b4', 'archive');
    const router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
    api.updateBooking.and.returnValue(of(booking({ id: 'b4', archived: false })));

    expect(el.querySelector('.kicker')?.textContent).toBe('Maria Huber · Archiv');
    expect(el.querySelector('[aria-label="Zurück"]')?.getAttribute('href')).toBe('/archiv');
    expect((el.querySelector('#booking-price') as HTMLInputElement).disabled).toBeTrue();
    expect(
      [...el.querySelectorAll<HTMLButtonElement>('.slot')].every((s) => s.disabled),
    ).toBeTrue();

    (el.querySelector('app-billing-panel .actions button') as HTMLButtonElement).click();
    await fixture.whenStable();

    expect(api.updateBooking).toHaveBeenCalledWith('b4', { archived: false });
    expect(router.navigate).toHaveBeenCalledWith(['/betreuungen', 'b4'], { replaceUrl: true });
  });

  it('archives an ended booking and goes to the archive', async () => {
    await setup('b3');
    const router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
    api.updateBooking.and.returnValue(of(booking({ id: 'b3', archived: true })));

    (el.querySelector('app-billing-panel .actions button') as HTMLButtonElement).click();
    await fixture.whenStable();

    expect(api.updateBooking).toHaveBeenCalledWith('b3', { archived: true });
    expect(router.navigate).toHaveBeenCalledWith(['/archiv']);
  });

  it('handles unknown bookings', async () => {
    await setup('nope');

    expect(el.querySelector('.empty-state')?.textContent).toContain('gibt es nicht');
  });
});
