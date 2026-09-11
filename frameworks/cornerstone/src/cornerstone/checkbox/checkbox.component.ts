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
  selector: 'cs-checkbox',
  providers: [valueAccessor(() => CheckboxComponent)],
  templateUrl: './checkbox.component.html',
  styleUrl: './checkbox.component.scss',
})
export class CheckboxComponent extends CsControlBase<boolean> {
  readonly indeterminate = model(false);
  protected toggle(): void {
    this.indeterminate.set(false);
    this.updateValue(!this.value());
  }
}
