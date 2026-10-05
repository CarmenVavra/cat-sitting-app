import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'betreuungen' },
  {
    path: 'betreuungen',
    title: 'Betreuungen · Katzenbetreuung',
    loadComponent: () =>
      import('./features/bookings/booking-list/booking-list').then((m) => m.BookingList),
  },
  {
    path: 'betreuungen/neu',
    title: 'Neue Betreuung · Katzenbetreuung',
    loadComponent: () =>
      import('./features/bookings/booking-new/booking-new').then((m) => m.BookingNew),
  },
  {
    path: 'betreuungen/:id',
    title: 'Besuchsplan · Katzenbetreuung',
    data: { section: 'list' },
    loadComponent: () =>
      import('./features/bookings/booking-detail/booking-detail').then((m) => m.BookingDetail),
  },
  {
    path: 'archiv',
    title: 'Archiv · Katzenbetreuung',
    loadComponent: () =>
      import('./features/archive/archive-list/archive-list').then((m) => m.ArchiveList),
  },
  {
    path: 'archiv/:id',
    title: 'Besuchsplan · Katzenbetreuung',
    data: { section: 'archive' },
    loadComponent: () =>
      import('./features/bookings/booking-detail/booking-detail').then((m) => m.BookingDetail),
  },
  {
    path: 'einstellungen',
    title: 'Einstellungen · Katzenbetreuung',
    loadComponent: () =>
      import('./features/settings/settings-page/settings-page').then((m) => m.SettingsPage),
  },
  { path: '**', redirectTo: 'betreuungen' },
];
