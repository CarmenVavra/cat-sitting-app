import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import {
  FakeApi,
  createFakeApi,
  provideFakeApi,
  provideFixedClock,
} from '../../../../testing/fixtures';
import { AppStore } from '../../../core/app-store';
import { SettingsPage } from './settings-page';

describe('SettingsPage', () => {
  let api: FakeApi;
  let fixture: ComponentFixture<SettingsPage>;
  let el: HTMLElement;

  beforeEach(async () => {
    api = createFakeApi({
      sitters: [
        { id: 's1', first: 'Anna', last: 'Weber' },
        { id: 's2', first: 'Lukas', last: '' },
        { id: 's3', first: 'Mia', last: '' },
      ],
    });
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideFakeApi(api), provideFixedClock()],
    });
    await TestBed.inject(AppStore).load();
    fixture = TestBed.createComponent(SettingsPage);
    await fixture.whenStable();
    el = fixture.nativeElement as HTMLElement;
  });

  afterEach(() => jasmine.clock().uninstall());

  async function setValue(selector: string, value: string): Promise<void> {
    const input = el.querySelector(selector) as HTMLInputElement;
    input.value = value;
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();
  }

  it('lists sitters with visit counts; sitters with visits cannot be removed', () => {
    const rows = [...el.querySelectorAll('.sitter-row')];
    expect(rows.map((r) => r.querySelector('.sitter-name')?.textContent)).toEqual([
      'Anna Weber',
      'Lukas',
      'Mia',
    ]);
    expect(rows[0].querySelector('.hint')?.textContent).toBe('6 Besuche');
    expect(rows[0].querySelector('button')?.disabled).toBeTrue();
    expect(rows[2].querySelector('button')?.disabled).toBeFalse();
  });

  it('removes a sitter without visits', async () => {
    (el.querySelectorAll('.sitter-row button')[2] as HTMLButtonElement).click();
    await fixture.whenStable();

    expect(api.deleteSitter).toHaveBeenCalledWith('s3');
    expect(el.querySelectorAll('.sitter-row').length).toBe(2);
  });

  it('requires a first name for new sitters', async () => {
    el.querySelector('.sitter-form')?.dispatchEvent(new Event('submit', { cancelable: true }));
    await fixture.whenStable();

    expect(el.querySelector('.field-error')?.textContent).toBe('Vorname ist ein Pflichtfeld.');
    expect(api.createSitter).not.toHaveBeenCalled();
  });

  it('adds a sitter and clears the form', async () => {
    api.createSitter.and.returnValue(of({ id: 's4', first: 'Eva', last: 'Berg' }));
    await setValue('#sitter-first', 'Eva');
    await setValue('#sitter-last', 'Berg');

    el.querySelector('.sitter-form')?.dispatchEvent(new Event('submit', { cancelable: true }));
    await fixture.whenStable();

    expect(api.createSitter).toHaveBeenCalledWith({ first: 'Eva', last: 'Berg' });
    expect(el.querySelectorAll('.sitter-row').length).toBe(4);
    expect((el.querySelector('#sitter-first') as HTMLInputElement).value).toBe('');
  });

  it('saves the default price', async () => {
    jasmine.clock().install();
    api.updateSettings.and.returnValue(of({ defaultPrice: 11.5 }));

    await setValue('#default-price', '11.5');
    jasmine.clock().tick(400);

    expect(api.updateSettings).toHaveBeenCalledWith({ defaultPrice: 11.5 });
  });

  it('lists saved owners with cats and contact', () => {
    const rows = [...el.querySelectorAll('.owner-row')];
    expect(rows[0].textContent).toContain('Maria Huber');
    expect(rows[0].textContent).toContain('Minka, Felix');
    expect(rows[2].querySelector('.hint')?.textContent).toBe('Keine Kontaktdaten');
  });
});
