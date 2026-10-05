import { TestBed } from '@angular/core/testing';
import { Icon } from './icon';

describe('Icon', () => {
  it('renders the lucide path in the given size', async () => {
    const fixture = TestBed.createComponent(Icon);
    fixture.componentRef.setInput('name', 'plus');
    fixture.componentRef.setInput('size', 16);
    await fixture.whenStable();

    const svg = (fixture.nativeElement as HTMLElement).querySelector('svg');
    expect(svg?.getAttribute('width')).toBe('16');
    expect(svg?.querySelector('path')?.getAttribute('d')).toBe('M12 5v14M5 12h14');
    expect((fixture.nativeElement as HTMLElement).getAttribute('aria-hidden')).toBe('true');
  });
});
