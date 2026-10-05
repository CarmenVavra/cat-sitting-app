import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SITTERS, TODAY, booking } from '../../../../testing/fixtures';
import { Booking } from '../../../core/models/api.models';
import { BillingPanel } from './billing-panel';

describe('BillingPanel', () => {
  let fixture: ComponentFixture<BillingPanel>;
  let el: HTMLElement;

  async function render(b: Booking, today = TODAY): Promise<void> {
    fixture = TestBed.createComponent(BillingPanel);
    fixture.componentRef.setInput('booking', b);
    fixture.componentRef.setInput('ownerName', 'Maria Huber');
    fixture.componentRef.setInput('sitters', SITTERS);
    fixture.componentRef.setInput('today', today);
    await fixture.whenStable();
    el = fixture.nativeElement as HTMLElement;
  }

  const text = (selector: string): string =>
    el.querySelector(selector)?.textContent?.replace(/\s+/g, ' ').trim() ?? '';

  it('shows the total for the owner and the amount per person', async () => {
    await render(booking());

    expect(text('.total-label')).toBe('An Maria Huber verrechnen');
    expect(text('.total-amount')).toBe('50,00 €');
    expect(text('.total-sub')).toBe('5 Besuche × 10,00 €');
    const people = [...el.querySelectorAll('.person')];
    expect(people.length).toBe(2);
    expect(people[0].querySelector('.name')?.textContent).toBe('Anna Weber');
    expect(people[0].querySelector('.person-amount')?.textContent).toBe('40,00 €');
    expect(people[0].querySelectorAll('.visits span').length).toBe(4);
  });

  it('warns about open past visits and future visits', async () => {
    await render(booking());

    expect(text('.notice b')).toBe('4');
    expect(text('.notice span')).toBe(
      'vergangene Besuche ohne Betreuungsperson – bitte nachtragen.',
    );
    expect(el.textContent).toContain('Noch 7 Besuche geplant. Betrag ist vorläufig.');
    expect(el.textContent).toContain('Archivieren ist nach dem 08.10.2026 möglich.');
  });

  it('offers archiving once the booking has ended', async () => {
    await render(booking(), '2026-10-09');
    let archived = 0;
    fixture.componentInstance.archive.subscribe(() => archived++);

    const button = el.querySelector('.actions button') as HTMLButtonElement;
    expect(button.textContent?.trim()).toBe('Ins Archiv verschieben');
    button.click();
    expect(archived).toBe(1);
  });

  it('offers restoring for archived bookings', async () => {
    await render(booking({ archived: true }));
    let restored = 0;
    fixture.componentInstance.restore.subscribe(() => restored++);

    const button = el.querySelector('.actions button') as HTMLButtonElement;
    expect(button.textContent?.trim()).toBe('Aus Archiv wiederherstellen');
    button.click();
    expect(restored).toBe(1);
    expect(el.textContent).not.toContain('Betrag ist vorläufig');
  });

  it('says when nothing has been recorded yet', async () => {
    await render(booking({ visits: {} }));

    expect(el.textContent).toContain('Noch keine Besuche erfasst.');
  });
});
