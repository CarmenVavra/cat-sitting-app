import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Subject, of, throwError } from 'rxjs';
import {
  FakeApi,
  OWNERS,
  SITTERS,
  booking,
  createFakeApi,
  provideFakeApi,
} from '../../testing/fixtures';
import { AppStore, errorMessage } from './app-store';
import { Booking } from './models/api.models';

describe('AppStore', () => {
  let api: FakeApi;
  let store: AppStore;

  const apiError = (status: number, message: string): HttpErrorResponse =>
    new HttpErrorResponse({ status, error: { error: message } });

  beforeEach(async () => {
    api = createFakeApi();
    TestBed.configureTestingModule({ providers: [provideFakeApi(api)] });
    store = TestBed.inject(AppStore);
    await store.load();
  });

  afterEach(() => jasmine.clock().uninstall());

  it('loads all data and splits live and archived bookings', () => {
    expect(store.ready()).toBeTrue();
    expect(store.sitters()).toEqual(SITTERS);
    expect(store.liveBookings().map((b) => b.id)).toEqual(['b3', 'b1', 'b2']);
    expect(store.archivedBookings().map((b) => b.id)).toEqual(['b4']);
  });

  it('reports load failures', async () => {
    api.getBookings.and.returnValue(throwError(() => new HttpErrorResponse({ status: 0 })));

    await store.load();

    expect(store.state()).toBe('error');
    expect(store.error()).toBe('Der Server ist nicht erreichbar.');
  });

  it('assigns visits optimistically and keeps the server result', async () => {
    const response = new Subject<Booking>();
    api.assignVisit.and.returnValue(response);

    const done = store.assignVisit('b1', '2026-10-06|F', 's2');
    expect(store.bookingById('b1')?.visits['2026-10-06|F']).toBe('s2');
    expect(api.assignVisit).toHaveBeenCalledWith('b1', '2026-10-06', 'F', 's2');

    const saved = booking({ visits: { '2026-10-06|F': 's2' } });
    response.next(saved);
    response.complete();

    expect(await done).toBeTrue();
    expect(store.bookingById('b1')).toEqual(saved);
  });

  it('rolls back a failed visit assignment and shows the server message', async () => {
    api.clearVisit.and.returnValue(throwError(() => apiError(409, 'Archiviert.')));
    const before = store.bookingById('b1');

    expect(await store.assignVisit('b1', '2026-10-01|F', null)).toBeFalse();

    expect(store.bookingById('b1')).toEqual(before);
    expect(store.error()).toBe('Archiviert.');
    store.dismissError();
    expect(store.error()).toBeNull();
  });

  it('applies a new booking price at once and saves it debounced', () => {
    jasmine.clock().install();
    api.updateBooking.and.returnValue(of(booking({ price: 12 })));

    store.setBookingPrice('b1', 11);
    store.setBookingPrice('b1', 12);

    expect(store.bookingById('b1')?.price).toBe(12);
    expect(api.updateBooking).not.toHaveBeenCalled();

    jasmine.clock().tick(400);
    expect(api.updateBooking).toHaveBeenCalledOnceWith('b1', { price: 12 });
  });

  it('does not change the price of archived bookings', () => {
    store.setBookingPrice('b4', 20);
    expect(store.bookingById('b4')?.price).toBe(9);
  });

  it('archives bookings', async () => {
    api.updateBooking.and.returnValue(of(booking({ archived: true })));

    expect(await store.setArchived('b1', true)).toBeTrue();
    expect(store.archivedBookings().map((b) => b.id)).toContain('b1');
  });

  it('creates owners, cats and bookings', async () => {
    const owner = { ...OWNERS[1], id: 'o9', name: 'Neu' };
    api.createOwner.and.returnValue(of(owner));
    api.addCat.and.returnValue(of({ ...owner, cats: [{ id: 'c9', name: 'Mimi' }] }));

    await store.createOwner({ name: 'Neu', address: '', phone: '', email: '', cats: [] });
    await store.addCatToOwner('o9', 'Mimi');
    expect(store.ownerById('o9')?.cats.map((c) => c.name)).toEqual(['Mimi']);

    const created = booking({ id: 'b9', ownerId: 'o9' });
    api.createBooking.and.returnValue(of(created));
    const request = {
      ownerId: 'o9',
      ownerName: 'Neu',
      address: '',
      phone: '',
      email: '',
      cats: ['Mimi'],
      from: '2026-10-10',
      to: '2026-10-11',
      price: 10,
    };

    expect(await store.createBooking(request)).toEqual(created);
    expect(store.bookingById('b9')).toEqual(created);
    expect(api.getOwners).toHaveBeenCalledTimes(2);
  });

  it('adds and removes sitters', async () => {
    api.createSitter.and.returnValue(of({ id: 's3', first: 'Mia', last: '' }));

    await store.createSitter('Mia', '');
    expect(store.sitters().map((s) => s.id)).toEqual(['s1', 's2', 's3']);

    expect(await store.deleteSitter('s3')).toBeTrue();
    expect(store.sitters().map((s) => s.id)).toEqual(['s1', 's2']);
  });

  it('saves the default price debounced', () => {
    jasmine.clock().install();
    api.updateSettings.and.returnValue(of({ defaultPrice: 12 }));

    store.setDefaultPrice(12);
    expect(store.settings().defaultPrice).toBe(12);

    jasmine.clock().tick(400);
    expect(api.updateSettings).toHaveBeenCalledOnceWith({ defaultPrice: 12 });
  });

  it('maps unknown errors to a generic message', () => {
    expect(errorMessage(new Error('x'))).toBe(
      'Etwas ist schiefgelaufen. Bitte noch einmal versuchen.',
    );
  });
});
