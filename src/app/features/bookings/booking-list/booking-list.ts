import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AppStore } from '../../../core/app-store';
import { Clock } from '../../../core/clock';
import { Icon } from '../../../shared/icon/icon';
import { PageHeader } from '../../../shared/page-header/page-header';
import { BookingCardView, toBookingCard } from '../booking-card-view';

@Component({
  selector: 'app-booking-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PageHeader, RouterLink, Icon],
  host: { class: 'page' },
  templateUrl: './booking-list.html',
  styleUrl: './booking-list.css',
})
export class BookingList {
  protected readonly store = inject(AppStore);
  private readonly clock = inject(Clock);

  private readonly cards = computed<BookingCardView[]>(() => {
    const today = this.clock.today();
    return this.store
      .liveBookings()
      .map((b) => toBookingCard(b, this.store.ownerById(b.ownerId), today));
  });

  /** Running and planned bookings. */
  protected readonly active = computed(() => this.cards().filter((c) => c.status !== 'ended'));

  /** Ended bookings, ready to be archived. */
  protected readonly ended = computed(() => this.cards().filter((c) => c.status === 'ended'));

  protected archive(id: string): void {
    void this.store.setArchived(id, true);
  }
}
