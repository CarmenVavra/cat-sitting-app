import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { localIsoDate } from './domain/dates';

const REFRESH_MS = 60_000;

/** Provides "today" as ISO date and keeps it current past midnight. */
@Injectable({ providedIn: 'root' })
export class Clock {
  private readonly todaySignal = signal(localIsoDate());
  readonly today = this.todaySignal.asReadonly();

  constructor() {
    const timer = setInterval(() => this.todaySignal.set(localIsoDate()), REFRESH_MS);
    inject(DestroyRef).onDestroy(() => clearInterval(timer));
  }
}
