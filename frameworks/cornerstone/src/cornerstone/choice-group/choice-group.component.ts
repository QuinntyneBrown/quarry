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
import { ChoiceMode } from './choice-mode.type';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'cs-choice-group',
  templateUrl: './choice-group.component.html',
  styleUrl: './choice-group.component.scss',
})
export class ChoiceGroupComponent {
  readonly label = input.required<string>();
  readonly mode = input<ChoiceMode>('single');
}
