import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AppStore } from '../../../core/app-store';
import { Clock } from '../../../core/clock';
import { catsLine } from '../../../core/domain/booking-calc';
import { formatRange } from '../../../core/domain/dates';
import { parsePrice } from '../../../core/domain/money';
import { VisitKey } from '../../../core/models/api.models';
import { PageHeader } from '../../../shared/page-header/page-header';
import { BillingPanel } from './billing-panel';
import { NewSitterName, SitterPicker } from './sitter-picker';
import { VisitPlan } from './visit-plan';

export type DetailSection = 'list' | 'archive';

@Component({
  selector: 'app-booking-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PageHeader, VisitPlan, BillingPanel, SitterPicker],
  host: { class: 'page' },
  templateUrl: './booking-detail.html',
  styleUrl: './booking-detail.css',
})
export class BookingDetail {
  /** Route parameter `:id`. */
  readonly id = input.required<string>();
  /** Route data: which navigation section the page belongs to (target of "Zurück"). */
  readonly section = input<DetailSection>('list');

  protected readonly store = inject(AppStore);
  protected readonly clock = inject(Clock);
  private readonly router = inject(Router);

  protected readonly tab = signal<'plan' | 'bill'>('plan');
  protected readonly pickerKey = signal<VisitKey | null>(null);

  protected readonly booking = computed(() => this.store.bookingById(this.id()));
  protected readonly owner = computed(() => {
    const b = this.booking();
    return b ? this.store.ownerById(b.ownerId) : undefined;
  });
  protected readonly editable = computed(() => !!this.booking() && !this.booking()?.archived);

  protected readonly kicker = computed(() => {
    const b = this.booking();
    if (!b) {
      return 'Katzenbetreuung';
    }
    return (this.owner()?.name ?? '?') + (b.archived ? ' · Archiv' : '');
  });
  protected readonly title = computed(() => {
    const b = this.booking();
    return b ? catsLine(b.cats.map((c) => c.name)) : 'Betreuung';
  });
  protected readonly backLink = computed(() =>
    this.section() === 'archive' ? '/archiv' : '/betreuungen',
  );
  protected readonly range = computed(() => {
    const b = this.booking();
    return b ? formatRange(b.from, b.to) : '';
  });
  protected readonly contact = computed(() => {
    const o = this.owner();
    return o ? [o.address, o.phone, o.email].filter(Boolean) : [];
  });
  protected readonly currentSitterId = computed(() => {
    const key = this.pickerKey();
    return (key && this.booking()?.visits[key]) || null;
  });

  protected onPriceInput(event: Event): void {
    const price = parsePrice((event.target as HTMLInputElement).value);
    if (price !== null) {
      this.store.setBookingPrice(this.id(), price);
    }
  }

  /** Puts the stored price back into the field if the typed value was invalid. */
  protected onPriceBlur(event: Event): void {
    const field = event.target as HTMLInputElement;
    const booking = this.booking();
    if (booking && parsePrice(field.value) === null) {
      field.value = String(booking.price);
    }
  }

  protected openPicker(key: VisitKey): void {
    if (this.editable()) {
      this.pickerKey.set(key);
    }
  }

  protected closePicker(): void {
    this.pickerKey.set(null);
  }

  protected assign(sitterId: string | null): void {
    const key = this.pickerKey();
    this.closePicker();
    if (key) {
      void this.store.assignVisit(this.id(), key, sitterId);
    }
  }

  /** Creates a sitter from the picker and assigns the slot to them. */
  protected async createAndAssign(name: NewSitterName): Promise<void> {
    const key = this.pickerKey();
    const sitter = await this.store.createSitter(name.first, name.last);
    if (sitter && key) {
      this.closePicker();
      await this.store.assignVisit(this.id(), key, sitter.id);
    }
  }

  protected async archive(): Promise<void> {
    if (await this.store.setArchived(this.id(), true)) {
      await this.router.navigate(['/archiv']);
    }
  }

  protected async restore(): Promise<void> {
    if (await this.store.setArchived(this.id(), false)) {
      await this.router.navigate(['/betreuungen', this.id()], { replaceUrl: true });
    }
  }
}
