import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  InjectionToken,
  Provider,
  computed,
  input,
  output,
} from '@angular/core';
import { BadgeComponent } from '../badge/badge.component';
import { CsButtonDirective } from '../core/foundations/cs-button.directive';
import { CardComponent } from '../card/card.component';
import { ProgressRingComponent } from '../progress-ring/progress-ring.component';
import { CheckboxComponent } from '../checkbox/checkbox.component';
import { Movement } from '../movement-list/movement.interface';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'cs-pip-strip',
  templateUrl: './pip-strip.component.html',
  styleUrl: './pip-strip.component.scss',
})
export class PipStripComponent {
  readonly label = input('Progress');
  readonly items = input.required<readonly Movement[]>();
}
