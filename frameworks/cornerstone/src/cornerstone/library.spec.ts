// Traces to: L2-001, L2-016, L2-017, L2-018, L2-021, L2-024, L2-026, L2-044, L2-051, L2-070, L2-083, L2-118, L2-163, L2-164
import { TestBed } from '@angular/core/testing';
import { ToastService } from './toast-outlet/toast.service';
import { csSafeUrl } from './core/platform/cs-safe-url.function';
import { ButtonHostComponent } from './testing/button-host/button-host.component';
import { CheckboxHostComponent } from './testing/checkbox-host/checkbox-host.component';
import { TabsHostComponent } from './testing/tabs-host/tabs-host.component';
import { QuizComponent } from './quiz/quiz.component';
import { QuizView } from './quiz/quiz-view.interface';

describe('@quinntyne/cornerstone contract', () => {
  it('applies typed button appearances', async () => {
    await TestBed.configureTestingModule({ imports: [ButtonHostComponent] }).compileComponents();
    const fixture = TestBed.createComponent(ButtonHostComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('button').classList).toContain(
      'cs-button--secondary',
    );
  });

  it('integrates custom controls with reactive forms', async () => {
    await TestBed.configureTestingModule({ imports: [CheckboxHostComponent] }).compileComponents();
    const fixture = TestBed.createComponent(CheckboxHostComponent);
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('input') as HTMLInputElement).click();
    expect(fixture.componentInstance.control.value).toBe(true);
    fixture.componentInstance.control.disable();
    fixture.detectChanges();
    expect((fixture.nativeElement.querySelector('input') as HTMLInputElement).disabled).toBe(true);
  });

  it('supports keyboard tab selection', async () => {
    await TestBed.configureTestingModule({ imports: [TabsHostComponent] }).compileComponents();
    const fixture = TestBed.createComponent(TabsHostComponent);
    fixture.detectChanges();
    const list = fixture.nativeElement.querySelector('[role=tablist]') as HTMLElement;
    list.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelectorAll('[role=tab]')[1].getAttribute('aria-selected'),
    ).toBe('true');
  });

  it('rejects unsafe URL schemes', () => {
    expect(csSafeUrl('javascript:alert(1)')).toBeNull();
    expect(csSafeUrl('data:text/html,bad')).toBeNull();
    expect(csSafeUrl('https://example.com')).toBe('https://example.com');
  });

  it('limits the toast outlet queue to three items', () => {
    const service = TestBed.inject(ToastService);
    for (let index = 0; index < 4; index += 1)
      service.open({ body: `Message ${index}`, duration: 60_000 });
    expect(service.items()).toHaveLength(3);
  });
});

describe('workflow intent boundary', () => {
  const view: QuizView = {
    id: 'quiz',
    title: 'Quiz',
    activeIndex: 0,
    questions: [{ id: 'q1', prompt: 'Choose', type: 'single', options: [{ id: 'a', label: 'A' }] }],
    answers: { q1: 'a' },
  };

  it('emits submission intent without persistence', async () => {
    await TestBed.configureTestingModule({ imports: [QuizComponent] }).compileComponents();
    const fixture = TestBed.createComponent(QuizComponent);
    fixture.componentRef.setInput('view', Object.freeze(view));
    const submitted = vi.fn();
    fixture.componentInstance.submitted.subscribe(submitted);
    fixture.detectChanges();
    (
      fixture.nativeElement.querySelector('.cs-action-bar button:last-child') as HTMLButtonElement
    ).click();
    expect(submitted).toHaveBeenCalledOnce();
    expect(view.answers).toEqual({ q1: 'a' });
  });
});
