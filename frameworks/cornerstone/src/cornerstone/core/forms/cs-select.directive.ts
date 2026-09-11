import {
  Directive,
  ElementRef,
  afterEveryRender,
  booleanAttribute,
  computed,
  inject,
  input,
} from '@angular/core';
import { CsControlBase } from '../platform/cs-control-base.class';
import { valueAccessor } from './value-accessor.function';

@Directive({
  selector: 'select[csSelect]',
  exportAs: 'csSelect',
  providers: [valueAccessor(() => CsSelectDirective)],
  host: {
    class: 'cs-select',
    '[disabled]': 'effectiveDisabled()',
    '[value]': 'value() ?? ""',
    '(change)': 'onChangeValue($event)',
    '(blur)': 'markTouched()',
  },
})
export class CsSelectDirective extends CsControlBase<string> {
  readonly disabledInput = input(false, { alias: 'disabled', transform: booleanAttribute });
  protected readonly effectiveDisabled = computed(() => this.disabledInput() || this.disabled());
  private readonly element = inject<ElementRef<HTMLSelectElement>>(ElementRef).nativeElement;

  constructor() {
    super();
    // Options can be rendered after the host value binding, including async lists.
    afterEveryRender(() => {
      const value = this.value() ?? '';
      if (this.element.value !== value) this.element.value = value;
    });
  }

  protected onChangeValue(event: Event): void {
    if (this.effectiveDisabled()) return;
    this.updateValue((event.target as HTMLSelectElement).value);
  }
}
