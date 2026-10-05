import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterNextRender,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { SLOT_LABEL, colorAt, parseVisitKey, sitterName } from '../../../core/domain/booking-calc';
import { formatFullDate, weekdayShort } from '../../../core/domain/dates';
import { Sitter, VisitKey } from '../../../core/models/api.models';

export interface NewSitterName {
  first: string;
  last: string;
}

/** "Wer war bei der Katze?" – bottom sheet on mobile, centred dialog on desktop. */
@Component({
  selector: 'app-sitter-picker',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown.escape)': 'closed.emit()' },
  template: `
    <div class="overlay">
      <button
        type="button"
        class="backdrop"
        tabindex="-1"
        aria-label="Auswahl schließen"
        (click)="closed.emit()"
      ></button>
      <div class="sheet" role="dialog" aria-modal="true" aria-labelledby="picker-title">
        <div class="sub">{{ subtitle() }}</div>
        <div class="title" id="picker-title">Wer war bei der Katze?</div>
        @for (o of options(); track o.id) {
          <button
            type="button"
            class="btn option"
            [class.btn-primary]="o.current"
            [class.btn-secondary]="!o.current"
            [attr.aria-pressed]="o.current"
            (click)="picked.emit(o.id)"
          >
            <span class="dot" [style.background]="o.color"></span>
            <span class="option-name">{{ o.name }}</span>
          </button>
        }
        <button type="button" class="btn btn-ghost clear" (click)="picked.emit(null)">
          Niemand / nicht erfasst
        </button>
        <form class="new" (submit)="$event.preventDefault(); create()">
          <label class="visually-hidden" for="picker-new">Neue Person (Vorname)</label>
          <input
            id="picker-new"
            class="input input-lg"
            placeholder="Neue Person (Vorname)"
            autocomplete="off"
            [value]="newName()"
            (input)="newName.set(value($event))"
          />
          <button type="submit" class="btn btn-secondary add">Anlegen</button>
        </form>
      </div>
    </div>
  `,
  styles: `
    .overlay {
      position: fixed;
      inset: 0;
      z-index: 20;
      display: flex;
      align-items: flex-end;
      justify-content: center;
    }
    .backdrop {
      position: absolute;
      inset: 0;
      border: 0;
      padding: 0;
      cursor: default;
      background: color-mix(in srgb, var(--color-neutral-900) 50%, transparent);
    }
    .sheet {
      position: relative;
      width: 100%;
      max-width: 420px;
      max-height: 90dvh;
      overflow: auto;
      background: var(--color-bg);
      border-top: 2px solid var(--color-text);
      padding: 18px 16px calc(22px + env(safe-area-inset-bottom));
      display: flex;
      flex-direction: column;
      gap: 8px;
      box-shadow: var(--shadow-lg);
    }
    .sub {
      font-size: 11px;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--color-accent);
      font-weight: 600;
    }
    .title {
      font-family: var(--font-heading);
      font-weight: 800;
      font-size: 22px;
      margin-bottom: 4px;
    }
    .option {
      width: 100%;
      min-height: 48px;
      font-size: 15px;
      gap: 10px;
    }
    .dot {
      width: 12px;
      height: 12px;
      flex: none;
      outline: 1px solid var(--color-bg);
    }
    .option-name {
      flex: 1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .clear {
      min-height: 44px;
    }
    .new {
      display: flex;
      gap: 8px;
      margin-top: 6px;
      padding-top: 12px;
      border-top: 1px solid var(--color-divider);
    }
    .add {
      min-height: 44px;
      flex: none;
    }
    @media (min-width: 900px) {
      .overlay {
        align-items: center;
      }
    }
  `,
})
export class SitterPicker {
  readonly slotKey = input.required<VisitKey>();
  readonly currentSitterId = input<string | null>(null);
  readonly sitters = input.required<readonly Sitter[]>();

  readonly picked = output<string | null>();
  readonly created = output<NewSitterName>();
  readonly closed = output<void>();

  protected readonly newName = signal('');

  protected readonly subtitle = computed(() => {
    const { day, slot } = parseVisitKey(this.slotKey());
    return `${weekdayShort(day)} ${formatFullDate(day)} · ${SLOT_LABEL[slot]}`;
  });

  protected readonly options = computed(() =>
    this.sitters().map((s, i) => ({
      id: s.id,
      name: sitterName(s),
      color: colorAt(i).bg,
      current: s.id === this.currentSitterId(),
    })),
  );

  constructor() {
    const host = inject<ElementRef<HTMLElement>>(ElementRef);
    afterNextRender(() =>
      host.nativeElement.querySelector<HTMLElement>('.option, .clear')?.focus(),
    );
  }

  protected value(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }

  /** "Anna Maria Weber" → first "Anna", last "Maria Weber". */
  protected create(): void {
    const parts = this.newName().trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) {
      return;
    }
    this.created.emit({ first: parts[0], last: parts.slice(1).join(' ') });
  }
}
