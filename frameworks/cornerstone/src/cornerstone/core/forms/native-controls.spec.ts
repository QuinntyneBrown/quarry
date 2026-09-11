// Traces to: L2-018, L2-044, L2-050
import { TestBed } from '@angular/core/testing';
import { NativeControlsHostComponent } from '../../testing/native-controls-host/native-controls-host.component';

describe('native control state', () => {
  it('disables native buttons and prevents disabled link navigation', () => {
    const fixture = TestBed.createComponent(NativeControlsHostComponent);
    fixture.componentInstance.disabled.set(true);
    fixture.detectChanges();
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    expect(button.disabled).toBe(true);
    button.click();
    expect(fixture.componentInstance.clicks()).toBe(0);
    const link: HTMLAnchorElement = fixture.nativeElement.querySelector('a');
    const click = new MouseEvent('click', { bubbles: true, cancelable: true });
    link.dispatchEvent(click);
    expect(click.defaultPrevented).toBe(true);
    expect(link.getAttribute('aria-disabled')).toBe('true');
    fixture.componentInstance.disabled.set(false);
    fixture.detectChanges();
    expect(button.disabled).toBe(false);
    expect(link.hasAttribute('tabindex')).toBe(false);
  });

  it('renders controlled and forms-driven values and disabled states', () => {
    const fixture = TestBed.createComponent(NativeControlsHostComponent);
    fixture.detectChanges();
    const select: HTMLSelectElement = fixture.nativeElement.querySelector('#controlled');
    const form: HTMLSelectElement = fixture.nativeElement.querySelector('#form');
    expect(select.value).toBe('b');
    expect(form.value).toBe('b');
    fixture.componentInstance.selected.set('a');
    fixture.componentInstance.disabled.set(true);
    fixture.componentInstance.control.setValue('a');
    fixture.componentInstance.control.disable();
    fixture.detectChanges();
    expect(select.value).toBe('a');
    expect(select.disabled).toBe(true);
    expect(form.value).toBe('a');
    expect(form.disabled).toBe(true);
    fixture.componentInstance.disabled.set(false);
    fixture.componentInstance.control.enable();
    fixture.detectChanges();
    form.value = 'b';
    form.dispatchEvent(new Event('change'));
    expect(fixture.componentInstance.control.value).toBe('b');
    expect(select.disabled).toBe(false);
  });
});
