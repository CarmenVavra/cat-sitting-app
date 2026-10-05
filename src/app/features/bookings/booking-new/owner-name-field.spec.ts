import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OWNERS } from '../../../../testing/fixtures';
import { Owner } from '../../../core/models/api.models';
import { OwnerNameField } from './owner-name-field';

describe('OwnerNameField', () => {
  let fixture: ComponentFixture<OwnerNameField>;
  let el: HTMLElement;
  let input: HTMLInputElement;
  let picked: Owner[];
  let creates: number;

  beforeEach(async () => {
    fixture = TestBed.createComponent(OwnerNameField);
    fixture.componentRef.setInput('owners', OWNERS);
    fixture.componentRef.setInput('value', '');
    picked = [];
    creates = 0;
    fixture.componentInstance.picked.subscribe((o) => picked.push(o));
    fixture.componentInstance.createRequested.subscribe(() => creates++);
    fixture.componentInstance.valueChange.subscribe((v) =>
      fixture.componentRef.setInput('value', v),
    );
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

  const options = (): string[] =>
    [...el.querySelectorAll('.suggest-opt')].map((o) =>
      o.querySelector('span')
        ? [...o.querySelectorAll('span')].map((s) => s.textContent).join(' | ')
        : (o.textContent?.trim() ?? ''),
    );

  it('suggests matching owners and offers to save a new name', async () => {
    await type('mar');

    expect(options()).toEqual(['Maria Huber | Minka, Felix', '+ „mar“ neu speichern']);
  });

  it('does not offer to save an existing name', async () => {
    await type('maria huber');

    expect(options()).toEqual(['Maria Huber | Minka, Felix']);
  });

  it('picks an owner on mousedown', async () => {
    await type('tho');
    const event = new MouseEvent('mousedown', { cancelable: true });
    el.querySelector('.owner-opt')?.dispatchEvent(event);
    await fixture.whenStable();

    expect(event.defaultPrevented).toBeTrue();
    expect(picked.map((o) => o.id)).toEqual(['o2']);
    expect(el.querySelector('.suggest')).toBeNull();
  });

  it('Enter picks the first suggestion, otherwise saves the new name', async () => {
    await type('sab');
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(picked.map((o) => o.id)).toEqual(['o3']);

    await type('Neue Person');
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(creates).toBe(1);
  });

  it('saves a new name on blur', async () => {
    await type('Neue Person');
    input.dispatchEvent(new Event('blur'));

    expect(creates).toBe(1);
  });

  it('does not save on blur when an owner is selected', async () => {
    fixture.componentRef.setInput('selectedId', 'o1');
    await type('Maria Huber');
    input.dispatchEvent(new Event('blur'));

    expect(creates).toBe(0);
  });

  it('shows error and status', async () => {
    fixture.componentRef.setInput('error', 'Name ist ein Pflichtfeld.');
    fixture.componentRef.setInput('status', 'Neu gespeichert');
    await fixture.whenStable();

    expect(el.querySelector('.field-error')?.textContent).toBe('Name ist ein Pflichtfeld.');
    expect(el.querySelector('.tag')?.textContent).toBe('Neu gespeichert');
  });
});
