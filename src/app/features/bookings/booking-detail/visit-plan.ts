import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { Booking, Sitter, VisitKey } from '../../../core/models/api.models';
import { bookingStats } from '../../../core/domain/booking-calc';
import { planDays } from './plan-view';

/** "Wer war wann da?" – one row per day with a morning and an evening slot. */
@Component({
  selector: 'app-visit-plan',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="plan" aria-labelledby="plan-heading">
      <div class="plan-head">
        <h6 id="plan-heading" class="section-label">Wer war wann da?</h6>
        <span class="count">{{ stats().done }} / {{ stats().total }} erfasst</span>
      </div>
      @if (editable()) {
        <div class="hint">Tippe auf Früh oder Abend, um die Betreuungsperson zu wählen.</div>
      }
      <div class="list-top">
        @for (day of days(); track day.date) {
          <div class="day" [class.today]="day.isToday">
            <div class="date">
              <span class="weekday">{{ day.weekday }}</span>
              <span class="daymonth">{{ day.dayMonth }}</span>
              @if (day.isToday) {
                <span class="today-label">Heute</span>
              }
            </div>
            @for (slot of day.slots; track slot.key) {
              <button
                type="button"
                class="slot"
                [class]="slot.state"
                [style.background]="slot.bg"
                [style.color]="slot.fg"
                [style.border-color]="slot.bg"
                [disabled]="!editable()"
                [attr.aria-label]="
                  day.weekday + ' ' + day.dayMonth + ' ' + slot.label + ': ' + slot.name
                "
                (click)="slotSelected.emit(slot.key)"
              >
                <span class="slot-label">{{ slot.label }}</span>
                <span class="slot-name">{{ slot.name }}</span>
              </button>
            }
          </div>
        }
      </div>
    </section>
  `,
  styles: `
    :host {
      display: block;
      min-width: 0;
    }
    .plan {
      padding: 12px 16px 20px;
    }
    .plan-head {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      gap: 12px;
      margin-bottom: 6px;
    }
    .count {
      font-size: 12px;
      color: var(--color-neutral-700);
      white-space: nowrap;
    }
    .hint {
      font-size: 12px;
      color: var(--color-neutral-700);
      margin-bottom: 6px;
    }
    .day {
      display: grid;
      grid-template-columns: 72px minmax(0, 1fr) minmax(0, 1fr);
      gap: 6px;
      padding: 6px 0;
      border-bottom: 1px solid var(--color-divider);
    }
    .day.today {
      background: var(--color-accent-100);
    }
    .date {
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding-left: 6px;
      line-height: 1.2;
    }
    .weekday {
      font-weight: 800;
      font-size: 15px;
    }
    .daymonth {
      font-size: 12px;
      color: var(--color-neutral-700);
    }
    .today-label {
      font-size: 10px;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--color-accent);
      font-weight: 600;
    }
    .slot {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      justify-content: center;
      gap: 1px;
      min-height: 48px;
      min-width: 0;
      padding: 6px 10px;
      text-align: left;
      font: inherit;
      cursor: pointer;
      background: transparent;
      border: 1px dashed var(--color-divider);
      color: var(--color-neutral-600);
    }
    .slot:disabled {
      cursor: default;
    }
    .slot.assigned {
      border-style: solid;
    }
    .slot.open {
      border-color: var(--color-accent-400);
      color: var(--color-accent-700);
    }
    .slot:not(:disabled):hover {
      filter: brightness(0.94);
    }
    .slot.open:not(:disabled):hover,
    .slot.future:not(:disabled):hover {
      filter: none;
      background: color-mix(in srgb, var(--color-text) 6%, transparent);
    }
    .slot-label {
      font-size: 10px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      opacity: 0.8;
    }
    .slot-name {
      font-weight: 600;
      font-size: 14px;
      max-width: 100%;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  `,
})
export class VisitPlan {
  readonly booking = input.required<Booking>();
  readonly sitters = input.required<readonly Sitter[]>();
  readonly today = input.required<string>();
  readonly editable = input(true);

  readonly slotSelected = output<VisitKey>();

  protected readonly days = computed(() => planDays(this.booking(), this.sitters(), this.today()));
  protected readonly stats = computed(() => bookingStats(this.booking()));
}
