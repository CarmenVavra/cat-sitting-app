import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AppStore } from './core/app-store';
import { Clock } from './core/clock';
import { formatFullDate, weekdayShort } from './core/domain/dates';
import { Icon, IconName } from './shared/icon/icon';

interface NavItem {
  path: string;
  label: string;
  icon: IconName;
  count: number | null;
}

/** App shell: sidebar (desktop) or bottom tab bar (mobile) around the routed page. */
@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Icon],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly store = inject(AppStore);
  private readonly clock = inject(Clock);

  protected readonly todayLabel = computed(() => {
    const today = this.clock.today();
    return `${weekdayShort(today)} ${formatFullDate(today)}`;
  });

  protected readonly nav = computed<NavItem[]>(() => [
    {
      path: '/betreuungen',
      label: 'Betreuungen',
      icon: 'calendar-days',
      count: this.store.liveBookings().length,
    },
    {
      path: '/archiv',
      label: 'Archiv',
      icon: 'archive',
      count: this.store.archivedBookings().length,
    },
    { path: '/einstellungen', label: 'Einstellungen', icon: 'sliders-horizontal', count: null },
  ]);

  constructor() {
    void this.store.load();
  }
}
