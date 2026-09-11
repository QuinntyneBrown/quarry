import { CdkTrapFocus } from '@angular/cdk/a11y';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterRenderEffect,
  booleanAttribute,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core';
import { CsButtonDirective } from '../core/foundations/cs-button.directive';
import { CsIdService } from '../core/platform/cs-id.service';

/** A controlled native modal dialog. Consumers set open=false after a dismissal request. */
@Component({
  selector: 'cs-review-dialog',
  imports: [CsButtonDirective, CdkTrapFocus],
  templateUrl: './review-dialog.component.html',
  styleUrl: './review-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReviewDialogComponent {
  readonly title = input.required<string>();
  readonly open = input(false, { transform: booleanAttribute });
  readonly closeLabel = input('Close dialog');
  readonly closed = output<void>();
  protected readonly headingId = inject(CsIdService).next('review-dialog');
  private readonly dialog = viewChild<ElementRef<HTMLDialogElement>>('dialog');
  private requested = false;
  private wasOpen = false;
  private opener: HTMLElement | null = null;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.restoreFocus());
    afterRenderEffect(() => {
      const open = this.open();
      const dialog = this.dialog()?.nativeElement;
      if (!dialog) return;
      if (open && !this.wasOpen) {
        this.requested = false;
        this.opener = dialog.ownerDocument.activeElement as HTMLElement | null;
        if (!dialog.open && typeof dialog.showModal === 'function') dialog.showModal();
      } else if (!open && this.wasOpen) {
        if (dialog.open) dialog.close();
        this.restoreFocus();
      }
      this.wasOpen = open;
    });
  }

  protected dismiss(event?: Event): void {
    event?.preventDefault();
    if (!this.open() || this.requested) return;
    this.requested = true;
    const dialog = this.dialog()?.nativeElement;
    if (dialog?.open && typeof dialog.close === 'function') dialog.close();
    this.restoreFocus();
    this.closed.emit();
  }

  protected nativeClosed(): void {
    if (this.dialog()?.nativeElement.open) return;
    if (this.open()) this.dismiss();
    else this.restoreFocus();
  }

  private restoreFocus(): void {
    if (this.opener?.isConnected) this.opener.focus();
    this.opener = null;
  }
}
