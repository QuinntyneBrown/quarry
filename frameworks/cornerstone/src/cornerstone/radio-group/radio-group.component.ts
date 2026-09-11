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
import { CsButtonDirective } from '../core/foundations/cs-button.directive';
import { CsControlBase } from '../core/platform/cs-control-base.class';
import { CsIdService } from '../core/platform/cs-id.service';
import { CsLocalizationService } from '../core/platform/cs-localization.service';
import { valueAccessor } from '../core/forms/value-accessor.function';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'cs-radio-group',
  providers: [valueAccessor(() => RadioGroupComponent)],
  templateUrl: './radio-group.component.html',
  host: { role: 'radiogroup' },
  styleUrl: './radio-group.component.scss',
})
export class RadioGroupComponent<T = string> extends CsControlBase<T> {
  readonly label = input.required<string>();
  select(value: T): void {
    this.updateValue(value);
  }
}
