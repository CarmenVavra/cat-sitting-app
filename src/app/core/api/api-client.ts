import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  Booking,
  CreateBookingRequest,
  CreateOwnerRequest,
  CreateSitterRequest,
  Owner,
  Settings,
  Sitter,
  SlotCode,
  UpdateBookingRequest,
} from '../models/api.models';

/** Thin typed wrapper around the PHP JSON API. */
@Injectable({ providedIn: 'root' })
export class ApiClient {
  private readonly http = inject(HttpClient);
  private readonly base = '/api';

  getSettings(): Observable<Settings> {
    return this.http.get<Settings>(`${this.base}/settings`);
  }

  updateSettings(settings: Settings): Observable<Settings> {
    return this.http.put<Settings>(`${this.base}/settings`, settings);
  }

  getSitters(): Observable<Sitter[]> {
    return this.http.get<Sitter[]>(`${this.base}/sitters`);
  }

  createSitter(request: CreateSitterRequest): Observable<Sitter> {
    return this.http.post<Sitter>(`${this.base}/sitters`, request);
  }

  deleteSitter(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/sitters/${encodeURIComponent(id)}`);
  }

  getOwners(): Observable<Owner[]> {
    return this.http.get<Owner[]>(`${this.base}/owners`);
  }

  createOwner(request: CreateOwnerRequest): Observable<Owner> {
    return this.http.post<Owner>(`${this.base}/owners`, request);
  }

  addCat(ownerId: string, name: string): Observable<Owner> {
    return this.http.post<Owner>(`${this.base}/owners/${encodeURIComponent(ownerId)}/cats`, {
      name,
    });
  }

  getBookings(): Observable<Booking[]> {
    return this.http.get<Booking[]>(`${this.base}/bookings`);
  }

  getBooking(id: string): Observable<Booking> {
    return this.http.get<Booking>(`${this.base}/bookings/${encodeURIComponent(id)}`);
  }

  createBooking(request: CreateBookingRequest): Observable<Booking> {
    return this.http.post<Booking>(`${this.base}/bookings`, request);
  }

  updateBooking(id: string, patch: UpdateBookingRequest): Observable<Booking> {
    return this.http.patch<Booking>(`${this.base}/bookings/${encodeURIComponent(id)}`, patch);
  }

  assignVisit(
    bookingId: string,
    day: string,
    slot: SlotCode,
    sitterId: string,
  ): Observable<Booking> {
    return this.http.put<Booking>(this.visitUrl(bookingId, day, slot), { sitterId });
  }

  clearVisit(bookingId: string, day: string, slot: SlotCode): Observable<Booking> {
    return this.http.delete<Booking>(this.visitUrl(bookingId, day, slot));
  }

  private visitUrl(bookingId: string, day: string, slot: SlotCode): string {
    return `${this.base}/bookings/${encodeURIComponent(bookingId)}/visits/${day}/${slot}`;
  }
}
