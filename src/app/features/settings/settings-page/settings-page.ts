import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { AppStore } from '../../../core/app-store';
import { colorAt, sitterName, sitterVisitCount } from '../../../core/domain/booking-calc';
import { parsePrice } from '../../../core/domain/money';
import { PageHeader } from '../../../shared/page-header/page-header';

@Component({
  selector: 'app-settings-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PageHeader],
  host: { class: 'page' },
  templateUrl: './settings-page.html',
  styleUrl: './settings-page.css',
})
export class SettingsPage {
  protected readonly store = inject(AppStore);

  protected readonly first = signal('');
  protected readonly last = signal('');
  protected readonly sitterError = signal('');

  protected readonly sitterRows = computed(() =>
    this.store.sitters().map((s, i) => {
      const visits = sitterVisitCount(this.store.bookings(), s.id);
      return { id: s.id, name: sitterName(s), color: colorAt(i).bg, visits, locked: visits > 0 };
    }),
  );

  protected readonly ownerRows = computed(() =>
    this.store.owners().map((o) => ({
      id: o.id,
      name: o.name,
      cats: o.cats.map((c) => c.name).join(', ') || '–',
      contact: [o.address, o.phone, o.email].filter(Boolean).join(' · ') || 'Keine Kontaktdaten',
    })),
  );

  protected value(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }

  protected onDefaultPrice(event: Event): void {
    const price = parsePrice(this.value(event));
    if (price !== null) {
      this.store.setDefaultPrice(price);
    }
  }

  protected onDefaultPriceBlur(event: Event): void {
    const field = event.target as HTMLInputElement;
    if (parsePrice(field.value) === null) {
      field.value = String(this.store.settings().defaultPrice);
    }
  }

  protected async addSitter(): Promise<void> {
    const first = this.first().trim();
    if (!first) {
      this.sitterError.set('Vorname ist ein Pflichtfeld.');
      return;
    }
    if (await this.store.createSitter(first, this.last().trim())) {
      this.first.set('');
      this.last.set('');
      this.sitterError.set('');
    }
  }

  protected removeSitter(id: string): void {
    void this.store.deleteSitter(id);
  }
}
