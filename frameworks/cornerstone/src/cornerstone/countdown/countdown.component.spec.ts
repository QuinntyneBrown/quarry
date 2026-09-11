// Traces to: L2-190
import { TestBed } from '@angular/core/testing';
import { CountdownComponent } from './countdown.component';

describe('countdown', () => {
  it('rounds up fractional seconds, hides zero days, and clamps expired or invalid times', () => {
    const fixture = TestBed.createComponent(CountdownComponent);
    fixture.componentRef.setInput('target', 90061000);
    fixture.componentRef.setInput('now', 0);
    fixture.detectChanges();
    expect(fixture.componentInstance.units().map((unit) => unit.value)).toEqual([1, 1, 1, 1]);
    fixture.componentRef.setInput('target', 501);
    fixture.detectChanges();
    expect(fixture.componentInstance.units().map((unit) => unit.value)).toEqual([0, 0, 1]);
    fixture.componentRef.setInput('now', 1000);
    fixture.detectChanges();
    expect(fixture.componentInstance.units().map((unit) => unit.value)).toEqual([0, 0, 0]);
    fixture.componentRef.setInput('target', Number.NaN);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toContain('NaN');
  });
});
