import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OWNERS } from '../../../../testing/fixtures';
import { CatChipInput } from './cat-chip-input';

describe('CatChipInput', () => {
  let fixture: ComponentFixture<CatChipInput>;
  let el: HTMLElement;
  let input: HTMLInputElement;
  let added: string[];
  let removed: string[];

  beforeEach(async () => {
    fixture = TestBed.createComponent(CatChipInput);
    fixture.componentRef.setInput('owners', OWNERS);
    fixture.componentRef.setInput('cats', ['Minka']);
    fixture.componentRef.setInput('selectedOwner', OWNERS[0]);
    added = [];
    removed = [];
    fixture.componentInstance.added.subscribe((c) => added.push(c));
    fixture.componentInstance.removed.subscribe((c) => removed.push(c));
    await fixture.whenStable();
    el = fixture.nativeElement as HTMLElement;
    input = el.querySelector('input') as HTMLInputElement;
  });

  async function type(text: string): Promise<void> {
    input.dispatchEvent(new Event('focus'));
    input.value = text;
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();
  }

  const key = (k: string): KeyboardEvent => {
    const event = new KeyboardEvent('keydown', { key: k, cancelable: true });
    input.dispatchEvent(event);
    return event;
  };

  it('renders chips with remove buttons', async () => {
    expect(el.querySelector('.chip')?.textContent?.trim()).toBe('Minka');
    expect(input.placeholder).toBe('Weitere Katze …');

    (el.querySelector('.chip-remove') as HTMLButtonElement).click();
    expect(removed).toEqual(['Minka']);
  });

  it('suggests the owner’s cats and other known cats', async () => {
    await type('i');

    const opts = [...el.querySelectorAll('.cat-opt')].map((o) =>
      [...o.querySelectorAll('span')].map((s) => s.textContent).join(' | '),
    );
    expect(opts).toEqual(['Felix | von Maria Huber', 'Tiger | bekannt']);
  });

  it('offers to save unknown names and adds them with Enter or comma', async () => {
    await type('Pünktchen');
    expect(el.querySelector('.suggest-create')?.textContent).toContain('„Pünktchen“ neu speichern');

    expect(key('Enter').defaultPrevented).toBeTrue();
    await type('Mimi');
    key(',');
    await fixture.whenStable();

    expect(added).toEqual(['Pünktchen', 'Mimi']);
    expect(input.value).toBe('');
  });

  it('Enter uses the known spelling of a cat', async () => {
    await type('FELIX');
    key('Enter');

    expect(added).toEqual(['Felix']);
  });

  it('Backspace in the empty input removes the last chip', async () => {
    key('Backspace');

    expect(removed).toEqual(['Minka']);
  });
});
