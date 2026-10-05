import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SITTERS } from '../../../../testing/fixtures';
import { NewSitterName, SitterPicker } from './sitter-picker';

describe('SitterPicker', () => {
  let fixture: ComponentFixture<SitterPicker>;
  let el: HTMLElement;
  let picked: (string | null)[];
  let created: NewSitterName[];
  let closed: number;

  beforeEach(async () => {
    fixture = TestBed.createComponent(SitterPicker);
    fixture.componentRef.setInput('slotKey', '2026-10-05|A');
    fixture.componentRef.setInput('sitters', SITTERS);
    fixture.componentRef.setInput('currentSitterId', 's2');
    picked = [];
    created = [];
    closed = 0;
    fixture.componentInstance.picked.subscribe((id) => picked.push(id));
    fixture.componentInstance.created.subscribe((n) => created.push(n));
    fixture.componentInstance.closed.subscribe(() => closed++);
    await fixture.whenStable();
    el = fixture.nativeElement as HTMLElement;
  });

  it('shows date and slot and highlights the current person', () => {
    expect(el.querySelector('.sub')?.textContent).toBe('Mo 05.10.2026 · Abend');
    const options = [...el.querySelectorAll('.option')];
    expect(options.map((o) => o.textContent?.trim())).toEqual(['Anna Weber', 'Lukas']);
    expect(options[1].classList).toContain('btn-primary');
    expect(options[0].classList).toContain('btn-secondary');
  });

  it('emits the chosen person or null for "Niemand"', () => {
    (el.querySelector('.option') as HTMLButtonElement).click();
    (el.querySelector('.clear') as HTMLButtonElement).click();

    expect(picked).toEqual(['s1', null]);
  });

  it('creates a new person, splitting first and last name', async () => {
    const input = el.querySelector('#picker-new') as HTMLInputElement;
    input.value = '  Anna  Maria Weber ';
    input.dispatchEvent(new Event('input'));
    el.querySelector('form')?.dispatchEvent(new Event('submit', { cancelable: true }));

    expect(created).toEqual([{ first: 'Anna', last: 'Maria Weber' }]);
  });

  it('ignores an empty new name', () => {
    el.querySelector('form')?.dispatchEvent(new Event('submit', { cancelable: true }));

    expect(created).toEqual([]);
  });

  it('closes on backdrop click and Escape', () => {
    (el.querySelector('.backdrop') as HTMLButtonElement).click();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

    expect(closed).toBe(2);
  });
});
