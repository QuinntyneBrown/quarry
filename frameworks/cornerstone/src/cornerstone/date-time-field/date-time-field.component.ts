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
  selector: 'cs-date-time-field',
  providers: [valueAccessor(() => DateTimeFieldComponent)],
  templateUrl: './date-time-field.component.html',
  styleUrl: './date-time-field.component.scss',
})
export class DateTimeFieldComponent extends CsControlBase<string> {
  protected change(e: Event): void {
    this.updateValue((e.target as HTMLInputElement).value);
  }
}
