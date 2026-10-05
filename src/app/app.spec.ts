import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { throwError } from 'rxjs';
import { createFakeApi, provideFakeApi, provideFixedClock } from '../testing/fixtures';
import { App } from './app';

describe('App', () => {
  async function setup(api = createFakeApi()) {
    TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([]), provideFakeApi(api), provideFixedClock()],
    });
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('loads the data and shows navigation with counts', async () => {
    const el = await setup();

    const links = [...el.querySelectorAll('.side-link')].map((a) => [
      a.querySelector('.side-label')?.textContent,
      a.querySelector('.side-count')?.textContent ?? null,
    ]);
    expect(links).toEqual([
      ['Betreuungen', '3'],
      ['Archiv', '1'],
      ['Einstellungen', null],
    ]);
    expect(el.querySelectorAll('.tab').length).toBe(3);
    expect(el.querySelector('.sidebar-foot')?.textContent).toContain('Heute · Mo 05.10.2026');
  });

  it('shows the server error as a dismissible message', async () => {
    const api = createFakeApi();
    api.getSettings.and.returnValue(throwError(() => new HttpErrorResponse({ status: 0 })));
    const el = await setup(api);

    expect(el.querySelector('.toast')?.textContent).toContain('Der Server ist nicht erreichbar.');
  });
});
