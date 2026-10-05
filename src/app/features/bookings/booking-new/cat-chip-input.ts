import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { catSuggestions, containsName, isKnownCat } from '../../../core/domain/suggestions';
import { Owner } from '../../../core/models/api.models';
import { Icon } from '../../../shared/icon/icon';

/**
 * Chip input for cats with autocomplete. Enter or comma adds, Backspace in the
 * empty input removes the last chip.
 */
@Component({
  selector: 'app-cat-chip-input',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  template: `
    <div class="field anchor">
      <label class="visually-hidden" for="cat-input">Katzen</label>
      <div class="chips" [class.invalid]="!!error()">
        @for (cat of cats(); track cat) {
          <span class="chip">
            {{ cat }}
            <button
              type="button"
              class="chip-remove"
              [attr.aria-label]="cat + ' entfernen'"
              (click)="removed.emit(cat)"
            >
              <app-icon name="x" [size]="14" [strokeWidth]="2.4" />
            </button>
          </span>
        }
        <input
          id="cat-input"
          class="chip-input"
          autocomplete="off"
          role="combobox"
          aria-autocomplete="list"
          aria-controls="cat-suggestions"
          [attr.aria-expanded]="open()"
          [placeholder]="cats().length ? 'Weitere Katze …' : 'Katzenname eingeben …'"
          [value]="query()"
          (input)="onInput($event)"
          (focus)="focused.set(true)"
          (blur)="focused.set(false)"
          (keydown)="onKey($event)"
        />
      </div>
      @if (open()) {
        <div class="suggest" id="cat-suggestions">
          @for (s of suggestions(); track s.name) {
            <button
              type="button"
              tabindex="-1"
              class="suggest-opt cat-opt"
              (mousedown)="$event.preventDefault(); add(s.name)"
            >
              <span class="name">{{ s.name }}</span
              ><span class="source">{{ s.source }}</span>
            </button>
          }
          @if (canCreate()) {
            <button
              type="button"
              tabindex="-1"
              class="suggest-opt suggest-create"
              (mousedown)="$event.preventDefault(); add(query())"
            >
              + „{{ query().trim() }}“ neu speichern
            </button>
          }
        </div>
      }
      @if (error()) {
        <div class="field-error">{{ error() }}</div>
      }
    </div>
  `,
  styles: `
    :host {
      display: block;
    }
    .anchor {
      position: relative;
    }
    .chips {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      align-items: center;
      min-height: 44px;
      padding: 6px;
      background: var(--color-surface);
      border: 1px solid var(--color-divider);
    }
    .chips:focus-within {
      border-color: var(--color-accent);
    }
    .chip {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 4px 4px 10px;
      background: var(--color-accent);
      color: var(--color-bg);
      font-size: 13px;
      font-weight: 600;
    }
    .chip-remove {
      border: 0;
      background: transparent;
      color: inherit;
      cursor: pointer;
      padding: 0 4px;
      display: flex;
    }
    .chip-input {
      flex: 1;
      min-width: 120px;
      border: 0;
      background: transparent;
      font: inherit;
      font-size: 14px;
      padding: 4px;
      outline: none;
      color: inherit;
      caret-color: var(--color-accent);
    }
    .cat-opt {
      justify-content: space-between;
      gap: 8px;
    }
    .name {
      font-weight: 600;
    }
    .source {
      font-size: 12px;
      color: var(--color-neutral-700);
    }
  `,
})
export class CatChipInput {
  readonly cats = input.required<readonly string[]>();
  readonly owners = input.required<readonly Owner[]>();
  readonly selectedOwner = input<Owner | null>(null);
  readonly error = input<string | null>(null);

  readonly added = output<string>();
  readonly removed = output<string>();

  protected readonly query = signal('');
  protected readonly focused = signal(false);

  protected readonly suggestions = computed(() =>
    catSuggestions(this.owners(), this.selectedOwner(), this.cats(), this.query()),
  );
  protected readonly canCreate = computed(() => {
    const q = this.query().trim();
    return !!q && !isKnownCat(this.owners(), q) && !containsName(this.cats(), q);
  });
  protected readonly open = computed(
    () => this.focused() && (this.suggestions().length > 0 || this.canCreate()),
  );

  protected onInput(event: Event): void {
    this.focused.set(true);
    this.query.set((event.target as HTMLInputElement).value);
  }

  protected onKey(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      const first = this.suggestions()[0];
      this.add(first && !this.canCreate() ? first.name : this.query());
    } else if (event.key === 'Backspace' && !this.query()) {
      const last = this.cats()[this.cats().length - 1];
      if (last !== undefined) {
        this.removed.emit(last);
      }
    } else if (event.key === 'Escape') {
      this.focused.set(false);
    }
  }

  protected add(raw: string): void {
    const name = raw.trim();
    this.query.set('');
    if (name) {
      this.added.emit(name);
    }
  }
}
