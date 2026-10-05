import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SITTERS, TODAY, booking } from '../../../../testing/fixtures';
import { VisitKey } from '../../../core/models/api.models';
import { VisitPlan } from './visit-plan';
import { planDays } from './plan-view';

describe('planDays', () => {
  it('describes assigned, open and future slots', () => {
    const days = planDays(booking(), SITTERS, TODAY);

    expect(days.length).toBe(8);
    expect(days[0]).toEqual(
      jasmine.objectContaining({ weekday: 'Do', dayMonth: '01.10.', isToday: false }),
    );
    expect(days[0].slots[0]).toEqual(
      jasmine.objectContaining({
        label: 'Früh',
        name: 'Anna Weber',
        state: 'assigned',
        bg: 'var(--color-accent)',
      }),
    );
    expect(days[1].slots[1]).toEqual(
      jasmine.objectContaining({ name: 'Lukas', fg: 'var(--color-bg)' }),
    );
    expect(days[2].slots[0]).toEqual(jasmine.objectContaining({ name: 'offen', state: 'open' }));
    const today = days[4];
    expect(today.isToday).toBeTrue();
    expect(today.slots.map((s) => s.state)).toEqual(['assigned', 'future']);
    expect(today.slots[1].name).toBe('—');
  });
});

describe('VisitPlan', () => {
  let fixture: ComponentFixture<VisitPlan>;
  let el: HTMLElement;

  beforeEach(async () => {
    fixture = TestBed.createComponent(VisitPlan);
    fixture.componentRef.setInput('booking', booking());
    fixture.componentRef.setInput('sitters', SITTERS);
    fixture.componentRef.setInput('today', TODAY);
    await fixture.whenStable();
    el = fixture.nativeElement as HTMLElement;
  });

  it('renders one row per day and highlights today', () => {
    expect(el.querySelectorAll('.day').length).toBe(8);
    expect(el.querySelector('.day.today .daymonth')?.textContent).toBe('05.10.');
    expect(el.querySelector('.count')?.textContent?.trim()).toBe('5 / 16 erfasst');
    expect(el.querySelector('.hint')).not.toBeNull();
  });

  it('emits the slot key on click', () => {
    const keys: VisitKey[] = [];
    fixture.componentInstance.slotSelected.subscribe((k) => keys.push(k));

    (el.querySelectorAll('.slot')[5] as HTMLButtonElement).click();

    expect(keys).toEqual(['2026-10-03|A']);
  });

  it('disables slots when read-only', async () => {
    fixture.componentRef.setInput('editable', false);
    await fixture.whenStable();

    expect(
      [...el.querySelectorAll<HTMLButtonElement>('.slot')].every((b) => b.disabled),
    ).toBeTrue();
    expect(el.querySelector('.hint')).toBeNull();
  });
});
