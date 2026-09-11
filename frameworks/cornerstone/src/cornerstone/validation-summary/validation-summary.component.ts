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
import { ValidationEntry } from './validation-entry.interface';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'cs-validation-summary',
  templateUrl: './validation-summary.component.html',
  styleUrl: './validation-summary.component.scss',
})
export class ValidationSummaryComponent {
  readonly title = input('Please correct the following');
  readonly errors = input<readonly ValidationEntry[]>([]);
}
