import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { findOwnerByName, ownerSuggestions } from '../../../core/domain/suggestions';
import { Owner } from '../../../core/models/api.models';

/**
 * Owner name input with autocomplete. A new name is saved right away on blur,
 * Enter or via the "+ neu speichern" option (the parent performs the save).
 */
@Component({
  selector: 'app-owner-name-field',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="field anchor">
      <label for="owner-name">Name *</label>
      <input
        id="owner-name"
        class="input input-lg"
        autocomplete="off"
        placeholder="z. B. Maria Huber"
        role="combobox"
        aria-autocomplete="list"
        aria-controls="owner-suggestions"
        [attr.aria-expanded]="open()"
        [attr.aria-invalid]="!!error()"
        [value]="value()"
        (input)="onInput($event)"
        (focus)="focused.set(true)"
        (blur)="onBlur()"
        (keydown.enter)="onEnter($event)"
        (keydown.escape)="focused.set(false)"
      />
      @if (open()) {
        <div class="suggest" id="owner-suggestions">
          @for (o of suggestions(); track o.id) {
            <button
              type="button"
              tabindex="-1"
              class="suggest-opt owner-opt"
              (mousedown)="$event.preventDefault(); pick(o)"
            >
              <span class="name">{{ o.name }}</span>
              <span class="cats">{{ catNames(o) }}</span>
            </button>
          }
          @if (canCreate()) {
            <button
              type="button"
              tabindex="-1"
              class="suggest-opt suggest-create"
              (mousedown)="$event.preventDefault(); create()"
            >
              + „{{ trimmed() }}“ neu speichern
            </button>
          }
        </div>
      }
      @if (error()) {
        <div class="field-error">{{ error() }}</div>
      }
      @if (status()) {
        <div class="status">
          <span class="tag tag-accent">{{ status() }}</span>
        </div>
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
    .owner-opt {
      flex-direction: column;
      align-items: flex-start;
    }
    .name {
      font-weight: 600;
      font-size: 14px;
    }
    .cats {
      font-size: 12px;
      color: var(--color-neutral-700);
    }
    .status {
      margin-top: 6px;
    }
  `,
})
export class OwnerNameField {
  readonly value = input.required<string>();
  readonly selectedId = input<string | null>(null);
  readonly owners = input.required<readonly Owner[]>();
  readonly error = input<string | null>(null);
  readonly status = input('');

  readonly valueChange = output<string>();
  readonly picked = output<Owner>();
  readonly createRequested = output<void>();

  protected readonly focused = signal(false);
  protected readonly trimmed = computed(() => this.value().trim());
  protected readonly suggestions = computed(() =>
    ownerSuggestions(this.owners(), this.value(), this.selectedId()),
  );
  private readonly exact = computed(() => !!findOwnerByName(this.owners(), this.value()));
  protected readonly canCreate = computed(() => !!this.trimmed() && !this.exact());
  protected readonly open = computed(
    () => this.focused() && (this.suggestions().length > 0 || this.canCreate()),
  );

  protected catNames(owner: Owner): string {
    return owner.cats.map((c) => c.name).join(', ') || 'keine Katzen';
  }

  protected onInput(event: Event): void {
    this.focused.set(true);
    this.valueChange.emit((event.target as HTMLInputElement).value);
  }

  protected onBlur(): void {
    this.focused.set(false);
    if (this.trimmed() && !this.selectedId()) {
      this.createRequested.emit();
    }
  }

  protected onEnter(event: Event): void {
    event.preventDefault();
    const first = this.suggestions()[0];
    if (first && !this.exact()) {
      this.pick(first);
    } else {
      this.create();
    }
  }

  protected pick(owner: Owner): void {
    this.focused.set(false);
    this.picked.emit(owner);
  }

  protected create(): void {
    this.focused.set(false);
    this.createRequested.emit();
  }
}
