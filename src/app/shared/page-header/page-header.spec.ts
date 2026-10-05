import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { PageHeader } from './page-header';

describe('PageHeader', () => {
  async function render(inputs: Record<string, unknown>) {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(PageHeader);
    for (const [key, value] of Object.entries(inputs)) {
      fixture.componentRef.setInput(key, value);
    }
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('shows kicker and title', async () => {
    const el = await render({ kicker: 'Verwaltung', title: 'Einstellungen' });

    expect(el.querySelector('.kicker')?.textContent).toBe('Verwaltung');
    expect(el.querySelector('h1')?.textContent).toBe('Einstellungen');
    expect(el.querySelector('[aria-label="Zurück"]')).toBeNull();
    expect(el.querySelector('.btn-primary')).toBeNull();
  });

  it('shows the back link and the "Neu" button on request', async () => {
    const el = await render({ kicker: 'K', title: 'T', backLink: '/archiv', showNew: true });

    expect(el.querySelector('[aria-label="Zurück"]')?.getAttribute('href')).toBe('/archiv');
    expect(el.querySelector('.btn-primary')?.getAttribute('href')).toBe('/betreuungen/neu');
  });
});
