import { CdkTextareaAutosize } from '@angular/cdk/text-field';
import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  ElementRef,
  Provider,
  booleanAttribute,
  computed,
  forwardRef,
  inject,
  input,
  model,
  output,
  signal,
} from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { CsButtonDirective } from '../foundations/cs-button.directive';
import { CsControlBase } from '../platform/cs-control-base.class';
import { CsIdService } from '../platform/cs-id.service';
import { CsLocalizationService } from '../platform/cs-localization.service';
import { CsInputType } from './cs-input-type.type';
import { valueAccessor } from './value-accessor.function';

@Directive({
  selector: 'input[csInput]',
  providers: [valueAccessor(() => CsInputDirective)],
  host: {
    class: 'cs-input',
    '[attr.disabled]': 'disabled() ? true : null',
    '[value]': 'value() ?? ""',
    '(input)': 'onInput($event)',
    '(blur)': 'markTouched()',
  },
})
export class CsInputDirective extends CsControlBase<string> {
  readonly type = input<CsInputType>('text');
  protected onInput(event: Event): void {
    this.updateValue((event.target as HTMLInputElement).value);
  }
}
