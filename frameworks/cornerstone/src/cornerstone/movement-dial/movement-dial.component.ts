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
import { DialVariant } from './dial-variant.type';
import { Movement } from '../movement-list/movement.interface';
import { MovementActivation } from '../movement-list/movement-activation.interface';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'cs-movement-dial',
  imports: [ProgressRingComponent],
  templateUrl: './movement-dial.component.html',
  styleUrl: './movement-dial.component.scss',
})
export class MovementDialComponent {
  readonly movements = input.required<readonly Movement[]>();
  readonly variant = input<DialVariant>('full');
  readonly complete = computed(() => this.movements().filter((m) => m.state === 'complete').length);
  readonly activated = output<MovementActivation>();
}
