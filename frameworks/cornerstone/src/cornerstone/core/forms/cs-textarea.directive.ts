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
import { valueAccessor } from './value-accessor.function';

@Directive({
  selector: 'textarea[csTextarea]',
  providers: [valueAccessor(() => CsTextareaDirective)],
  hostDirectives: [
    {
      directive: CdkTextareaAutosize,
      inputs: ['cdkAutosizeMinRows:minRows', 'cdkAutosizeMaxRows:maxRows'],
    },
  ],
  host: {
    class: 'cs-textarea',
    '[attr.disabled]': 'disabled() ? true : null',
    '[value]': 'value() ?? ""',
    '(input)': 'onInput($event)',
    '(blur)': 'markTouched()',
  },
})
export class CsTextareaDirective extends CsControlBase<string> {
  readonly minRows = input(2);
  readonly maxRows = input(8);
  protected onInput(event: Event): void {
    this.updateValue((event.target as HTMLTextAreaElement).value);
  }
}
