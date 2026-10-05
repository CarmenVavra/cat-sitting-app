import { TestBed } from '@angular/core/testing';
import { Clock } from './clock';
import { localIsoDate } from './domain/dates';

describe('Clock', () => {
  afterEach(() => jasmine.clock().uninstall());

  it('provides today and refreshes it every minute', () => {
    jasmine.clock().install();
    jasmine.clock().mockDate(new Date(2026, 9, 5, 23, 59, 30));

    const clock = TestBed.inject(Clock);
    expect(clock.today()).toBe('2026-10-05');

    jasmine.clock().tick(60_000);
    expect(clock.today()).toBe('2026-10-06');
  });

  it('starts with the real local date', () => {
    expect(TestBed.inject(Clock).today()).toBe(localIsoDate());
  });
});
