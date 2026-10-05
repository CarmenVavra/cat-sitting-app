import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AppStore } from '../../../core/app-store';
import { Clock } from '../../../core/clock';
import { parsePrice } from '../../../core/domain/money';
import { canonicalCatName, containsName, findOwnerByName } from '../../../core/domain/suggestions';
import { Owner } from '../../../core/models/api.models';
import { PageHeader } from '../../../shared/page-header/page-header';
import { BookingFormErrors, bookingSummary, validateBookingForm } from './booking-form';
import { CatChipInput } from './cat-chip-input';
import { OwnerNameField } from './owner-name-field';

@Component({
  selector: 'app-booking-new',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PageHeader, RouterLink, OwnerNameField, CatChipInput],
  host: { class: 'page' },
  templateUrl: './booking-new.html',
  styleUrl: './booking-new.css',
})
export class BookingNew {
  protected readonly store = inject(AppStore);
  private readonly router = inject(Router);

  protected readonly ownerId = signal<string | null>(null);
  protected readonly ownerName = signal('');
  protected readonly ownerSaved = signal(false);
  protected readonly address = signal('');
  protected readonly phone = signal('');
  protected readonly email = signal('');
  protected readonly cats = signal<string[]>([]);
  protected readonly from = signal(inject(Clock).today());
  protected readonly to = signal('');
  protected readonly price = signal(String(this.store.settings().defaultPrice));
  protected readonly errors = signal<BookingFormErrors>({});
  protected readonly saving = signal(false);
  private creatingOwner = false;

  protected readonly selectedOwner = computed(() => {
    const id = this.ownerId();
    return (id && this.store.ownerById(id)) || null;
  });

  protected readonly ownerStatus = computed(() => {
    const owner = this.selectedOwner();
    if (!owner) {
      return '';
    }
    return this.ownerSaved()
      ? 'Neu gespeichert'
      : `Gespeichert · ${owner.cats.length} Katze(n) bekannt`;
  });

  protected readonly summary = computed(() => bookingSummary(this.from(), this.to(), this.price()));

  protected value(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }

  protected onOwnerName(name: string): void {
    this.ownerName.set(name);
    this.ownerId.set(findOwnerByName(this.store.owners(), name)?.id ?? null);
    this.ownerSaved.set(false);
  }

  /** Fills contact data and all known cats of an existing owner. */
  protected pickOwner(owner: Owner): void {
    this.ownerId.set(owner.id);
    this.ownerName.set(owner.name);
    this.address.set(owner.address);
    this.phone.set(owner.phone);
    this.email.set(owner.email);
    this.cats.set(owner.cats.map((c) => c.name));
    this.ownerSaved.set(false);
    this.clearError('owner');
  }

  /** Saves a new owner immediately (or selects an existing one with that name). */
  protected async createOwner(): Promise<void> {
    const name = this.ownerName().trim();
    if (!name || this.creatingOwner) {
      return;
    }
    const existing = findOwnerByName(this.store.owners(), name);
    if (existing) {
      this.ownerId.set(existing.id);
      this.ownerName.set(existing.name);
      return;
    }

    this.creatingOwner = true;
    const owner = await this.store.createOwner({
      name,
      address: this.address().trim(),
      phone: this.phone().trim(),
      email: this.email().trim(),
      cats: this.cats(),
    });
    this.creatingOwner = false;
    // Only apply if the user hasn't changed the name in the meantime.
    if (owner && this.ownerName().trim().toLocaleLowerCase() === name.toLocaleLowerCase()) {
      this.ownerId.set(owner.id);
      this.ownerSaved.set(true);
      this.clearError('owner');
    }
  }

  /** Adds a cat to the form and saves it on the selected owner right away. */
  protected addCat(raw: string): void {
    if (containsName(this.cats(), raw)) {
      return;
    }
    const name = canonicalCatName(this.store.owners(), raw);
    this.cats.update((list) => [...list, name]);
    this.clearError('cats');

    const owner = this.selectedOwner();
    if (
      owner &&
      !containsName(
        owner.cats.map((c) => c.name),
        name,
      )
    ) {
      void this.store.addCatToOwner(owner.id, name);
    }
  }

  protected removeCat(name: string): void {
    this.cats.update((list) => list.filter((c) => c !== name));
  }

  protected async save(): Promise<void> {
    const errors = validateBookingForm({
      ownerName: this.ownerName(),
      cats: this.cats(),
      from: this.from(),
      to: this.to(),
      price: this.price(),
    });
    this.errors.set(errors);
    if (Object.keys(errors).length > 0 || this.saving()) {
      return;
    }

    this.saving.set(true);
    const booking = await this.store.createBooking({
      ownerId: this.ownerId(),
      ownerName: this.ownerName().trim(),
      address: this.address().trim(),
      phone: this.phone().trim(),
      email: this.email().trim(),
      cats: this.cats(),
      from: this.from(),
      to: this.to(),
      price: parsePrice(this.price()) ?? 0,
    });
    this.saving.set(false);
    if (booking) {
      await this.router.navigate(['/betreuungen', booking.id], { replaceUrl: true });
    }
  }

  private clearError(key: keyof BookingFormErrors): void {
    if (this.errors()[key]) {
      this.errors.update((e) => ({ ...e, [key]: undefined }));
    }
  }
}
