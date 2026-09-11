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

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'cs-field',
  templateUrl: './field.component.html',
  styleUrl: './field.component.scss',
  host: { class: 'cs-field' },
})
export class FieldComponent {
  private readonly ids = inject(CsIdService);
  readonly label = input.required<string>();
  readonly forId = input(this.ids.next('control'));
  readonly hint = input('');
  readonly error = input('');
  readonly required = input(false, { transform: booleanAttribute });
  readonly hintId = signal(this.ids.next('hint'));
  readonly errorId = signal(this.ids.next('error'));
}
