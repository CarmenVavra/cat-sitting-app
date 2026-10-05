import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icon } from '../icon/icon';

@Component({
  selector: 'app-page-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Icon],
  template: `
    <header class="page-header">
      @if (backLink(); as link) {
        <a class="btn btn-secondary btn-icon" [routerLink]="link" aria-label="Zurück">
          <app-icon name="chevron-left" [size]="18" />
        </a>
      }
      <div class="titles">
        <div class="kicker">{{ kicker() }}</div>
        <h1 class="title" [attr.title]="title()">{{ title() }}</h1>
      </div>
      @if (showNew()) {
        <a class="btn btn-primary" routerLink="/betreuungen/neu">
          <app-icon name="plus" [size]="16" [strokeWidth]="2.4" />Neu
        </a>
      }
    </header>
  `,
  styles: `
    .page-header {
      display: flex;
      align-items: flex-end;
      gap: 12px;
      padding: 20px 16px 14px;
      border-bottom: 2px solid var(--color-divider);
      flex: none;
    }
    .titles {
      flex: 1;
      min-width: 0;
    }
    .kicker {
      font-size: 10px;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--color-accent);
      font-weight: 600;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .title {
      margin: 0;
      font-size: 26px;
      line-height: 1.1;
      letter-spacing: -0.015em;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  `,
})
export class PageHeader {
  readonly kicker = input.required<string>();
  readonly title = input.required<string>();
  /** Shows the back button linking here. */
  readonly backLink = input<string | null>(null);
  readonly showNew = input(false);
}
