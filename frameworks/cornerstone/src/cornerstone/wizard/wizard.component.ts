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
import { WizardStep } from './wizard-step.interface';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'cs-wizard',
  imports: [CsButtonDirective],
  templateUrl: './wizard.component.html',
  styleUrl: './wizard.component.scss',
})
export class WizardComponent {
  readonly steps = input.required<readonly WizardStep[]>();
  readonly active = model(0);
  readonly completed = output<void>();
  readonly stepChanged = output<number>();
  protected back(): void {
    this.active.update((v) => Math.max(0, v - 1));
    this.stepChanged.emit(this.active());
  }
  protected next(): void {
    if (this.active() >= this.steps().length - 1) this.completed.emit();
    else {
      this.active.update((v) => v + 1);
      this.stepChanged.emit(this.active());
    }
  }
}
