import { Provider, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { ApiClient } from '../app/core/api/api-client';
import { Clock } from '../app/core/clock';
import { Booking, Owner, Settings, Sitter } from '../app/core/models/api.models';

/** Fixed "today" used across the specs (matches the design prototype). */
export const TODAY = '2026-10-05';

export const SITTERS: Sitter[] = [
  { id: 's1', first: 'Anna', last: 'Weber' },
  { id: 's2', first: 'Lukas', last: '' },
];

export const OWNERS: Owner[] = [
  {
    id: 'o1',
    name: 'Maria Huber',
    address: 'Lindengasse 12, 1070 Wien',
    phone: '+43 664 123 45 67',
    email: 'maria.huber@mail.at',
    cats: [
      { id: 'c1', name: 'Minka' },
      { id: 'c2', name: 'Felix' },
    ],
  },
  {
    id: 'o2',
    name: 'Thomas Berger',
    address: '',
    phone: '+43 699',
    email: '',
    cats: [{ id: 'c3', name: 'Luna' }],
  },
  {
    id: 'o3',
    name: 'Sabine Leitner',
    address: '',
    phone: '',
    email: '',
    cats: [{ id: 'c4', name: 'Tiger' }],
  },
];

export function booking(overrides: Partial<Booking> = {}): Booking {
  return {
    id: 'b1',
    ownerId: 'o1',
    cats: [
      { id: 'c1', name: 'Minka' },
      { id: 'c2', name: 'Felix' },
    ],
    from: '2026-10-01',
    to: '2026-10-08',
    price: 10,
    archived: false,
    visits: {
      '2026-10-01|F': 's1',
      '2026-10-01|A': 's1',
      '2026-10-02|F': 's1',
      '2026-10-02|A': 's2',
      '2026-10-05|F': 's1',
    },
    ...overrides,
  };
}

export function bookings(): Booking[] {
  return [
    booking(),
    booking({
      id: 'b2',
      ownerId: 'o2',
      cats: [{ id: 'c3', name: 'Luna' }],
      from: '2026-10-12',
      to: '2026-10-15',
      price: 12,
      visits: {},
    }),
    booking({
      id: 'b3',
      ownerId: 'o3',
      cats: [{ id: 'c4', name: 'Tiger' }],
      from: '2026-09-20',
      to: '2026-09-23',
      visits: { '2026-09-20|F': 's2' },
    }),
    booking({
      id: 'b4',
      from: '2026-08-10',
      to: '2026-08-16',
      price: 9,
      archived: true,
      visits: { '2026-08-10|F': 's1', '2026-08-10|A': 's1' },
    }),
  ];
}

export type FakeApi = jasmine.SpyObj<ApiClient>;

/** ApiClient spy pre-loaded with the fixture data. */
export function createFakeApi(
  data: { settings?: Settings; sitters?: Sitter[]; owners?: Owner[]; bookings?: Booking[] } = {},
): FakeApi {
  const api = jasmine.createSpyObj<ApiClient>('ApiClient', [
    'getSettings',
    'updateSettings',
    'getSitters',
    'createSitter',
    'deleteSitter',
    'getOwners',
    'createOwner',
    'addCat',
    'getBookings',
    'getBooking',
    'createBooking',
    'updateBooking',
    'assignVisit',
    'clearVisit',
  ]);
  api.getSettings.and.returnValue(of(data.settings ?? { defaultPrice: 10 }));
  api.getSitters.and.returnValue(of(data.sitters ?? SITTERS));
  api.getOwners.and.returnValue(of(data.owners ?? OWNERS));
  api.getBookings.and.returnValue(of(data.bookings ?? bookings()));
  api.deleteSitter.and.returnValue(of(undefined) as Observable<void>);
  return api;
}

export function provideFakeApi(api: FakeApi): Provider {
  return { provide: ApiClient, useValue: api };
}

export function provideFixedClock(today = TODAY): Provider {
  return { provide: Clock, useValue: { today: signal(today).asReadonly() } };
}
