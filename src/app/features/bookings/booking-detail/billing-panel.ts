import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { billSummary, bookingStatus } from '../../../core/domain/booking-calc';
import { formatFullDate } from '../../../core/domain/dates';
import { formatEur } from '../../../core/domain/money';
import { Booking, Sitter } from '../../../core/models/api.models';

/** "Abrechnung": total for the owner and the amount per sitter. */
@Component({
  selector: 'app-billing-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="bill" aria-label="Abrechnung">
      <div class="total">
        <div class="total-label">An {{ ownerName() }} verrechnen</div>
        <div class="total-amount">{{ eur(bill().total) }}</div>
        <div class="total-sub">{{ bill().done }} Besuche × {{ priceText() }}</div>
      </div>

      @if (bill().openPast > 0) {
        <div class="notice">
          <b>{{ bill().openPast }}</b
          ><span>vergangene Besuche ohne Betreuungsperson – bitte nachtragen.</span>
        </div>
      }
      @if (bill().future > 0 && !booking().archived) {
        <div class="hint">Noch {{ bill().future }} Besuche geplant. Betrag ist vorläufig.</div>
      }

      <h6 class="section-label per-person">Pro Person</h6>
      @for (p of bill().people; track p.sitterId) {
        <div class="person">
          <div class="person-head">
            <span class="swatch" [style.background]="p.color"></span>
            <div class="person-name">
              <div class="name">{{ p.name }}</div>
              <div class="sub">{{ p.count }} Besuche × {{ priceText() }}</div>
            </div>
            <div class="person-amount">{{ eur(p.amount) }}</div>
          </div>
          <div class="visits">
            @for (v of p.visits; track v) {
              <span>{{ v }}</span>
            }
          </div>
        </div>
      } @empty {
        <div class="hint">Noch keine Besuche erfasst.</div>
      }

      <div class="actions">
        @if (booking().archived) {
          <button type="button" class="btn btn-secondary" (click)="restore.emit()">
            Aus Archiv wiederherstellen
          </button>
        } @else if (ended()) {
          <button type="button" class="btn btn-secondary" (click)="archive.emit()">
            Ins Archiv verschieben
          </button>
        } @else {
          <span class="hint">Archivieren ist nach dem {{ endLabel() }} möglich.</span>
        }
      </div>
    </section>
  `,
  styles: `
    :host {
      display: block;
      min-width: 0;
    }
    .bill {
      padding: 12px 16px 20px;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .total {
      background: var(--color-accent);
      color: var(--color-bg);
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .total-label {
      font-size: 11px;
      letter-spacing: 0.1em;
      text-transform: uppercase;
    }
    .total-amount {
      font-family: var(--font-heading);
      font-weight: 800;
      font-size: 40px;
      line-height: 1.05;
      letter-spacing: -0.02em;
    }
    .total-sub {
      font-size: 13px;
    }
    .notice {
      display: flex;
      gap: 8px;
      align-items: flex-start;
      font-size: 13px;
      color: var(--color-accent-700);
      border: 1px solid var(--color-accent-300);
      background: var(--color-accent-100);
      padding: 8px 10px;
    }
    .hint {
      font-size: 12px;
      color: var(--color-neutral-700);
    }
    .per-person {
      margin-top: 4px;
    }
    .person {
      border-top: 2px solid var(--color-text);
      padding-top: 10px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .person-head {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .person-name {
      flex: 1;
      min-width: 0;
    }
    .name {
      font-weight: 800;
      font-size: 17px;
    }
    .sub {
      font-size: 12px;
      color: var(--color-neutral-700);
    }
    .person-amount {
      font-family: var(--font-heading);
      font-weight: 800;
      font-size: 22px;
    }
    .visits {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(118px, 1fr));
      gap: 2px 12px;
      font-size: 12px;
      color: var(--color-neutral-800);
    }
    .actions {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      margin-top: 8px;
    }
  `,
})
export class BillingPanel {
  readonly booking = input.required<Booking>();
  readonly ownerName = input.required<string>();
  readonly sitters = input.required<readonly Sitter[]>();
  readonly today = input.required<string>();

  readonly archive = output<void>();
  readonly restore = output<void>();

  protected readonly bill = computed(() =>
    billSummary(this.booking(), this.sitters(), this.today()),
  );
  protected readonly priceText = computed(() => formatEur(this.booking().price));
  protected readonly ended = computed(
    () => bookingStatus(this.booking(), this.today()) === 'ended',
  );
  protected readonly endLabel = computed(() => formatFullDate(this.booking().to));

  protected eur(amount: number): string {
    return formatEur(amount);
  }
}
