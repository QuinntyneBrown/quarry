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
import { DateBounds } from './date-bounds.interface';
import { valueAccessor } from '../core/forms/value-accessor.function';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'cs-date-field',
  providers: [valueAccessor(() => DateFieldComponent)],
  templateUrl: './date-field.component.html',
  styleUrl: './date-field.component.scss',
})
export class DateFieldComponent extends CsControlBase<string> {
  readonly bounds = input<DateBounds>({});
  protected change(e: Event): void {
    this.updateValue((e.target as HTMLInputElement).value);
  }
}
