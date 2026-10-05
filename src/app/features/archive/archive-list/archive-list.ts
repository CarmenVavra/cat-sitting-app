import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AppStore } from '../../../core/app-store';
import { Clock } from '../../../core/clock';
import { bookingStats } from '../../../core/domain/booking-calc';
import { formatEur } from '../../../core/domain/money';
import { PageHeader } from '../../../shared/page-header/page-header';
import { toBookingCard } from '../../bookings/booking-card-view';

@Component({
  selector: 'app-archive-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PageHeader, RouterLink],
  host: { class: 'page' },
  template: `
    <app-page-header kicker="Abgeschlossen" title="Archiv" />
    <main class="page-main">
      <div class="page-stack archive">
        @if (!store.ready()) {
          <p class="muted">Lade …</p>
        } @else {
          @if (rows().length === 0) {
            <div class="empty-state">Das Archiv ist leer.</div>
          }
          <div class="list-top">
            @for (r of rows(); track r.id) {
              <a class="row" [routerLink]="['/archiv', r.id]">
                <span class="cats">{{ r.cats }}</span>
                <span class="amount">{{ r.amount }}</span>
                <span class="meta">{{ r.owner }} · {{ r.range }}</span>
                <span class="meta right">{{ r.done }} Besuche</span>
              </a>
            }
          </div>
          @if (rows().length > 0) {
            <div class="sum">
              <span>Summe Archiv</span><b>{{ total() }}</b>
            </div>
          }
        }
      </div>
    </main>
  `,
  styles: `
    .archive {
      gap: 12px;
    }
    .row {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 4px 12px;
      padding: 12px 4px;
      border-bottom: 1px solid var(--color-divider);
      color: var(--color-text);
      text-decoration: none;
    }
    .row:hover {
      background: var(--color-neutral-200);
      color: var(--color-text);
    }
    .cats,
    .amount {
      font-weight: 800;
      font-size: 16px;
    }
    .amount,
    .right {
      text-align: right;
    }
    .meta {
      font-size: 12px;
      color: var(--color-neutral-700);
    }
    .sum {
      display: flex;
      justify-content: space-between;
      font-size: 13px;
      padding: 4px;
    }
  `,
})
export class ArchiveList {
  protected readonly store = inject(AppStore);
  private readonly clock = inject(Clock);

  protected readonly rows = computed(() =>
    this.store
      .archivedBookings()
      .map((b) => toBookingCard(b, this.store.ownerById(b.ownerId), this.clock.today())),
  );

  protected readonly total = computed(() =>
    formatEur(this.store.archivedBookings().reduce((sum, b) => sum + bookingStats(b).amount, 0)),
  );
}
