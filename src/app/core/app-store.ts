import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, firstValueFrom } from 'rxjs';
import { ApiClient } from './api/api-client';
import { parseVisitKey } from './domain/booking-calc';
import {
  ApiError,
  Booking,
  CreateBookingRequest,
  CreateOwnerRequest,
  Owner,
  Sitter,
  VisitKey,
} from './models/api.models';

export type LoadState = 'idle' | 'loading' | 'ready' | 'error';

const SAVE_DELAY_MS = 400;

/**
 * Single source of truth for the app data. Components read signals and call the
 * async actions; actions resolve to `null`/`false` on failure and expose the
 * server's message through `error`.
 */
@Injectable({ providedIn: 'root' })
export class AppStore {
  private readonly api = inject(ApiClient);
  private readonly saveTimers = new Map<string, ReturnType<typeof setTimeout>>();

  private readonly settingsState = signal({ defaultPrice: 10 });
  private readonly sittersState = signal<Sitter[]>([]);
  private readonly ownersState = signal<Owner[]>([]);
  private readonly bookingsState = signal<Booking[]>([]);
  private readonly loadState = signal<LoadState>('idle');
  private readonly errorState = signal<string | null>(null);

  readonly settings = this.settingsState.asReadonly();
  readonly sitters = this.sittersState.asReadonly();
  readonly owners = this.ownersState.asReadonly();
  readonly bookings = this.bookingsState.asReadonly();
  readonly state = this.loadState.asReadonly();
  readonly error = this.errorState.asReadonly();
  readonly ready = computed(() => this.loadState() === 'ready');

  /** Not archived, sorted by start date ascending. */
  readonly liveBookings = computed(() =>
    this.bookingsState()
      .filter((b) => !b.archived)
      .sort((a, b) => a.from.localeCompare(b.from)),
  );

  /** Archived, sorted by start date descending. */
  readonly archivedBookings = computed(() =>
    this.bookingsState()
      .filter((b) => b.archived)
      .sort((a, b) => b.from.localeCompare(a.from)),
  );

  async load(): Promise<void> {
    this.loadState.set('loading');
    try {
      const [settings, sitters, owners, bookings] = await Promise.all([
        firstValueFrom(this.api.getSettings()),
        firstValueFrom(this.api.getSitters()),
        firstValueFrom(this.api.getOwners()),
        firstValueFrom(this.api.getBookings()),
      ]);
      this.settingsState.set(settings);
      this.sittersState.set(sitters);
      this.ownersState.set(owners);
      this.bookingsState.set(bookings);
      this.loadState.set('ready');
    } catch (e) {
      this.loadState.set('error');
      this.fail(e);
    }
  }

  dismissError(): void {
    this.errorState.set(null);
  }

  bookingById(id: string): Booking | undefined {
    return this.bookingsState().find((b) => b.id === id);
  }

  ownerById(id: string): Owner | undefined {
    return this.ownersState().find((o) => o.id === id);
  }

  // — owners —

  async createOwner(request: CreateOwnerRequest): Promise<Owner | null> {
    const owner = await this.run(this.api.createOwner(request));
    if (owner) {
      this.upsertOwner(owner);
    }
    return owner;
  }

  async addCatToOwner(ownerId: string, name: string): Promise<Owner | null> {
    const owner = await this.run(this.api.addCat(ownerId, name));
    if (owner) {
      this.upsertOwner(owner);
    }
    return owner;
  }

  // — bookings —

  async createBooking(request: CreateBookingRequest): Promise<Booking | null> {
    const booking = await this.run(this.api.createBooking(request));
    if (!booking) {
      return null;
    }
    this.upsertBooking(booking);
    // Contact data and cats were stored on the owner as well.
    const owners = await this.run(this.api.getOwners());
    if (owners) {
      this.ownersState.set(owners);
    }
    return booking;
  }

  /** Applies the price immediately and saves it shortly after the last change. */
  setBookingPrice(id: string, price: number): void {
    const booking = this.bookingById(id);
    if (!booking || booking.archived || booking.price === price) {
      return;
    }
    this.upsertBooking({ ...booking, price });
    this.debounce(`price:${id}`, async () => {
      const saved = await this.run(this.api.updateBooking(id, { price }));
      if (saved) {
        this.upsertBooking(saved);
      } else {
        await this.refreshBooking(id);
      }
    });
  }

  async setArchived(id: string, archived: boolean): Promise<boolean> {
    const saved = await this.run(this.api.updateBooking(id, { archived }));
    if (saved) {
      this.upsertBooking(saved);
    }
    return !!saved;
  }

  /** Assigns a sitter to a visit slot (or clears it with `null`), optimistically. */
  async assignVisit(bookingId: string, key: VisitKey, sitterId: string | null): Promise<boolean> {
    const before = this.bookingById(bookingId);
    if (!before) {
      return false;
    }
    const visits = { ...before.visits };
    if (sitterId) {
      visits[key] = sitterId;
    } else {
      delete visits[key];
    }
    this.upsertBooking({ ...before, visits });

    const { day, slot } = parseVisitKey(key);
    const saved = await this.run(
      sitterId
        ? this.api.assignVisit(bookingId, day, slot, sitterId)
        : this.api.clearVisit(bookingId, day, slot),
    );
    this.upsertBooking(saved ?? before);
    return !!saved;
  }

  // — sitters —

  async createSitter(first: string, last: string): Promise<Sitter | null> {
    const sitter = await this.run(this.api.createSitter({ first, last }));
    if (sitter) {
      this.sittersState.update((list) => [...list, sitter]);
    }
    return sitter;
  }

  async deleteSitter(id: string): Promise<boolean> {
    const ok = (await this.run(this.api.deleteSitter(id), true)) !== null;
    if (ok) {
      this.sittersState.update((list) => list.filter((s) => s.id !== id));
    }
    return ok;
  }

  // — settings —

  /** Applies the default price immediately and saves it shortly after the last change. */
  setDefaultPrice(defaultPrice: number): void {
    if (this.settingsState().defaultPrice === defaultPrice) {
      return;
    }
    this.settingsState.set({ defaultPrice });
    this.debounce('defaultPrice', async () => {
      const saved = await this.run(this.api.updateSettings({ defaultPrice }));
      if (saved) {
        this.settingsState.set(saved);
      }
    });
  }

  // — internals —

  private async refreshBooking(id: string): Promise<void> {
    const fresh = await this.run(this.api.getBooking(id));
    if (fresh) {
      this.upsertBooking(fresh);
    }
  }

  private upsertBooking(booking: Booking): void {
    this.bookingsState.update((list) =>
      list.some((b) => b.id === booking.id)
        ? list.map((b) => (b.id === booking.id ? booking : b))
        : [...list, booking],
    );
  }

  private upsertOwner(owner: Owner): void {
    this.ownersState.update((list) =>
      list.some((o) => o.id === owner.id)
        ? list.map((o) => (o.id === owner.id ? owner : o))
        : [...list, owner],
    );
  }

  private debounce(key: string, task: () => Promise<void>): void {
    clearTimeout(this.saveTimers.get(key));
    this.saveTimers.set(
      key,
      setTimeout(() => {
        this.saveTimers.delete(key);
        void task();
      }, SAVE_DELAY_MS),
    );
  }

  /**
   * Runs a request; on failure records the error and resolves to null.
   * `emptyOk` maps an empty (204) response to `true` instead of `null`.
   */
  private async run<T>(request: Observable<T>, emptyOk?: false): Promise<T | null>;
  private async run<T>(request: Observable<T>, emptyOk: true): Promise<T | true | null>;
  private async run<T>(request: Observable<T>, emptyOk = false): Promise<T | true | null> {
    try {
      const result = await firstValueFrom(request, { defaultValue: null });
      return result ?? (emptyOk ? true : null);
    } catch (e) {
      this.fail(e);
      return null;
    }
  }

  private fail(error: unknown): void {
    this.errorState.set(errorMessage(error));
  }
}

export function errorMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    const body = error.error as Partial<ApiError> | null;
    if (body && typeof body.error === 'string') {
      return body.error;
    }
    if (error.status === 0) {
      return 'Der Server ist nicht erreichbar.';
    }
  }
  return 'Etwas ist schiefgelaufen. Bitte noch einmal versuchen.';
}
