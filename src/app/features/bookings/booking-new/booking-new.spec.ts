import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import {
  FakeApi,
  OWNERS,
  TODAY,
  booking,
  createFakeApi,
  provideFakeApi,
  provideFixedClock,
} from '../../../../testing/fixtures';
import { AppStore } from '../../../core/app-store';
import { BookingNew } from './booking-new';

describe('BookingNew', () => {
  let api: FakeApi;
  let fixture: ComponentFixture<BookingNew>;
  let el: HTMLElement;

  beforeEach(async () => {
    api = createFakeApi({ settings: { defaultPrice: 12 } });
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideFakeApi(api), provideFixedClock()],
    });
    await TestBed.inject(AppStore).load();
    fixture = TestBed.createComponent(BookingNew);
    await fixture.whenStable();
    el = fixture.nativeElement as HTMLElement;
  });

  const field = (selector: string): HTMLInputElement =>
    el.querySelector(selector) as HTMLInputElement;

  async function setValue(selector: string, value: string): Promise<void> {
    const input = field(selector);
    input.dispatchEvent(new Event('focus'));
    input.value = value;
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();
  }

  async function submit(): Promise<void> {
    el.querySelector('form')?.dispatchEvent(new Event('submit', { cancelable: true }));
    await fixture.whenStable();
  }

  const errors = (): string[] =>
    [...el.querySelectorAll('.field-error')].map((e) => e.textContent?.trim() ?? '');

  it('starts today with the default price', () => {
    expect(field('#date-from').value).toBe(TODAY);
    expect(field('#price').value).toBe('12');
    expect([...el.querySelectorAll('.summary-value')].map((e) => e.textContent)).toEqual([
      '–',
      '–',
      '–',
    ]);
  });

  it('validates on save', async () => {
    await submit();

    expect(errors()).toEqual([
      'Name ist ein Pflichtfeld.',
      'Mindestens eine Katze angeben.',
      'Bitte Beginn und Ende wählen.',
    ]);
    expect(api.createBooking).not.toHaveBeenCalled();
  });

  it('prefills contact data and cats when picking a saved owner', async () => {
    await setValue('#owner-name', 'maria');
    el.querySelector('.owner-opt')?.dispatchEvent(
      new MouseEvent('mousedown', { cancelable: true }),
    );
    await fixture.whenStable();

    expect(field('#owner-name').value).toBe('Maria Huber');
    expect(field('#owner-address').value).toBe('Lindengasse 12, 1070 Wien');
    expect([...el.querySelectorAll('.chip')].map((c) => c.textContent?.trim())).toEqual([
      'Minka',
      'Felix',
    ]);
    expect(el.querySelector('app-owner-name-field .tag')?.textContent).toBe(
      'Gespeichert · 2 Katze(n) bekannt',
    );
  });

  it('saves a new owner immediately on blur', async () => {
    api.createOwner.and.returnValue(of({ ...OWNERS[1], id: 'o9', name: 'Eva Neu', cats: [] }));

    await setValue('#owner-name', 'Eva Neu');
    field('#owner-name').dispatchEvent(new Event('blur'));
    await fixture.whenStable();

    expect(api.createOwner).toHaveBeenCalledWith(jasmine.objectContaining({ name: 'Eva Neu' }));
    expect(el.querySelector('app-owner-name-field .tag')?.textContent).toBe('Neu gespeichert');
  });

  it('stores added cats on the selected owner right away', async () => {
    api.addCat.and.returnValue(
      of({ ...OWNERS[0], cats: [...OWNERS[0].cats, { id: 'c9', name: 'Pünktchen' }] }),
    );
    await setValue('#owner-name', 'Maria Huber');

    await setValue('#cat-input', 'Pünktchen');
    field('#cat-input').dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    await fixture.whenStable();

    expect(api.addCat).toHaveBeenCalledWith('o1', 'Pünktchen');
  });

  it('creates the booking and opens its detail view', async () => {
    const router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
    api.createBooking.and.returnValue(of(booking({ id: 'b9' })));
    api.addCat.and.returnValue(of(OWNERS[0]));

    await setValue('#owner-name', 'Maria Huber');
    await setValue('#cat-input', 'Minka');
    field('#cat-input').dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    await setValue('#date-to', '2026-10-08');
    await setValue('#price', '12.5');

    expect([...el.querySelectorAll('.summary-value')].map((e) => e.textContent)).toEqual([
      '4',
      '8',
      '100,00 €',
    ]);

    await submit();

    expect(api.createBooking).toHaveBeenCalledWith({
      ownerId: 'o1',
      ownerName: 'Maria Huber',
      address: '',
      phone: '',
      email: '',
      cats: ['Minka'],
      from: TODAY,
      to: '2026-10-08',
      price: 12.5,
    });
    expect(router.navigate).toHaveBeenCalledWith(['/betreuungen', 'b9'], { replaceUrl: true });
  });
});
