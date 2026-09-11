import { Directive, DestroyRef, ElementRef, booleanAttribute, inject, input } from '@angular/core';
import { CsButtonAppearance } from './cs-button-appearance.type';
import { CsButtonSize } from './cs-button-size.type';

@Directive({
  selector: 'button[csButton],a[csButton]',
  host: {
    '[class]': "'cs-button cs-button--' + appearance() + ' cs-button--' + size()",
    '[attr.aria-busy]': 'loading() || null',
    '[attr.aria-disabled]': 'disabled() ? true : null',
    '[attr.disabled]': 'nativeButton && disabled() ? true : null',
    '[attr.tabindex]': 'disabled() ? -1 : originalTabIndex',
  },
})
export class CsButtonDirective {
  readonly appearance = input<CsButtonAppearance, CsButtonAppearance | ''>('primary', {
    alias: 'csButton',
    transform: (value) => value || 'primary',
  });
  readonly size = input<CsButtonSize>('medium');
  readonly loading = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  private readonly element =
    inject<ElementRef<HTMLButtonElement | HTMLAnchorElement>>(ElementRef).nativeElement;
  protected readonly nativeButton = this.element.tagName === 'BUTTON';
  protected readonly originalTabIndex = this.element.getAttribute('tabindex');

  constructor() {
    const guard = (event: Event) => {
      if (this.disabled()) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    };
    this.element.addEventListener('click', guard, true);
    this.element.addEventListener('auxclick', guard, true);
    inject(DestroyRef).onDestroy(() => {
      this.element.removeEventListener('click', guard, true);
      this.element.removeEventListener('auxclick', guard, true);
    });
  }
}
