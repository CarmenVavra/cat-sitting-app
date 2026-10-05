import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { booking } from '../../../testing/fixtures';
import { ApiClient } from './api-client';

describe('ApiClient', () => {
  let api: ApiClient;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(ApiClient);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('loads bookings', () => {
    let result: unknown;
    api.getBookings().subscribe((b) => (result = b));

    const req = http.expectOne('/api/bookings');
    expect(req.request.method).toBe('GET');
    req.flush([booking()]);

    expect(result).toEqual([booking()]);
  });

  it('creates owners and adds cats', () => {
    api.createOwner({ name: 'Maria', address: '', phone: '', email: '', cats: [] }).subscribe();
    expect(http.expectOne({ method: 'POST', url: '/api/owners' }).request.body.name).toBe('Maria');

    api.addCat('o 1', 'Minka').subscribe();
    const req = http.expectOne({ method: 'POST', url: '/api/owners/o%201/cats' });
    expect(req.request.body).toEqual({ name: 'Minka' });
  });

  it('patches bookings', () => {
    api.updateBooking('b1', { archived: true }).subscribe();

    const req = http.expectOne({ method: 'PATCH', url: '/api/bookings/b1' });
    expect(req.request.body).toEqual({ archived: true });
  });

  it('assigns and clears visits', () => {
    api.assignVisit('b1', '2026-10-05', 'F', 's1').subscribe();
    const put = http.expectOne({ method: 'PUT', url: '/api/bookings/b1/visits/2026-10-05/F' });
    expect(put.request.body).toEqual({ sitterId: 's1' });

    api.clearVisit('b1', '2026-10-05', 'A').subscribe();
    http.expectOne({ method: 'DELETE', url: '/api/bookings/b1/visits/2026-10-05/A' });
  });

  it('manages sitters and settings', () => {
    api.createSitter({ first: 'Anna', last: 'Weber' }).subscribe();
    http.expectOne({ method: 'POST', url: '/api/sitters' });

    api.deleteSitter('s1').subscribe();
    http.expectOne({ method: 'DELETE', url: '/api/sitters/s1' });

    api.updateSettings({ defaultPrice: 12 }).subscribe();
    expect(http.expectOne({ method: 'PUT', url: '/api/settings' }).request.body).toEqual({
      defaultPrice: 12,
    });
  });
});
