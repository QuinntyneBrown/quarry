// Traces to: L2-191
import { TestBed } from '@angular/core/testing';
import { ReviewDialogComponent } from './review-dialog.component';

describe('review dialog', () => {
  it('emits one dismissal per open cycle and does not emit for parent closure', () => {
    const fixture = TestBed.createComponent(ReviewDialogComponent);
    fixture.componentRef.setInput('title', 'Review');
    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();
    const closed = vi.fn();
    fixture.componentInstance.closed.subscribe(closed);
    const dialog: HTMLDialogElement = fixture.nativeElement.querySelector('dialog');
    dialog.dispatchEvent(new Event('cancel', { cancelable: true }));
    dialog.dispatchEvent(new Event('close'));
    expect(closed).toHaveBeenCalledTimes(1);
    fixture.componentRef.setInput('open', false);
    fixture.detectChanges();
    dialog.dispatchEvent(new Event('close'));
    expect(closed).toHaveBeenCalledTimes(1);
  });
});
