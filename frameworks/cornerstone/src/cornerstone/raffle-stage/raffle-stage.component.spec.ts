// Traces to: L2-193
import { TestBed } from '@angular/core/testing';
import { RaffleStageComponent } from './raffle-stage.component';
import { CONFETTI_STARTER } from './confetti-starter.token';

describe('raffle stage', () => {
  it('clears the owned clock when destroyed during a draw', async () => {
    const interval = vi.spyOn(globalThis, 'setInterval');
    const clear = vi.spyOn(globalThis, 'clearInterval');
    try {
      const fixture = TestBed.createComponent(RaffleStageComponent);
      fixture.componentRef.setInput('result', {
        id: 'future',
        label: 'Ada',
        candidates: ['Ada'],
        start: Date.now(),
        reveal: Date.now() + 60_000,
      });
      fixture.detectChanges();
      await fixture.whenStable();
      const timerIndex = interval.mock.calls.findIndex((call) => call[1] === 50);
      expect(timerIndex).toBeGreaterThanOrEqual(0);
      const timer = interval.mock.results[timerIndex].value;
      fixture.destroy();
      expect(clear).toHaveBeenCalledWith(timer);
    } finally {
      interval.mockRestore();
      clear.mockRestore();
    }
  });
  it('falls back to CSS when GPU initialization fails and stops all effects on request', async () => {
    const start = vi.fn(async () => {
      throw new Error('GPU unavailable');
    });
    TestBed.configureTestingModule({ providers: [{ provide: CONFETTI_STARTER, useValue: start }] });
    const fixture = TestBed.createComponent(RaffleStageComponent);
    fixture.componentRef.setInput('now', 1000);
    fixture.componentRef.setInput('result', {
      id: 'draw',
      label: 'Ada',
      candidates: ['Ada'],
      start: 0,
      reveal: 2000,
    });
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.componentRef.setInput('now', 2000);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(start).toHaveBeenCalledOnce();
    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.particles')).not.toBeNull();
    });
    fixture.componentInstance.stopEffects();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.particles')).toBeNull();
  });

  it('disposes a renderer that finishes initialization after its component is destroyed', async () => {
    let finish: (dispose: () => void) => void = () => {};
    const pending = new Promise<() => void>((resolve) => {
      finish = resolve;
    });
    const start = vi.fn(() => pending);
    TestBed.configureTestingModule({ providers: [{ provide: CONFETTI_STARTER, useValue: start }] });
    const fixture = TestBed.createComponent(RaffleStageComponent);
    fixture.componentRef.setInput('now', 1000);
    fixture.componentRef.setInput('result', {
      id: 'draw',
      label: 'Ada',
      candidates: [],
      start: 0,
      reveal: 2000,
    });
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.componentRef.setInput('now', 2000);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(start).toHaveBeenCalledOnce();
    fixture.destroy();
    const dispose = vi.fn();
    finish(dispose);
    await pending;
    expect(dispose).toHaveBeenCalledOnce();
  });

  it('reveals the supplied winner without replaying celebration on late arrival', () => {
    const fixture = TestBed.createComponent(RaffleStageComponent);
    fixture.componentRef.setInput('now', 1000);
    fixture.componentRef.setInput('result', {
      id: 'draw',
      label: 'Ada · A-01',
      candidates: [],
      start: 0,
      reveal: 2000,
    });
    fixture.detectChanges();
    expect(fixture.componentInstance.drawing()).toBe(true);
    expect(fixture.nativeElement.textContent).not.toContain('undefined');
    fixture.componentRef.setInput('now', 2000);
    fixture.detectChanges();
    expect(fixture.componentInstance.drawing()).toBe(false);
    expect(fixture.nativeElement.textContent).toContain('Ada');
    fixture.componentInstance.stopEffects();
    expect(fixture.componentInstance.celebrating()).toBe(false);
    fixture.componentRef.setInput('result', {
      id: 'late',
      label: 'Grace · B-02',
      candidates: [],
      start: 0,
      reveal: 1000,
    });
    fixture.detectChanges();
    expect(fixture.componentInstance.celebrating()).toBe(false);
    expect(fixture.nativeElement.textContent).toContain('Grace');
  });
});
