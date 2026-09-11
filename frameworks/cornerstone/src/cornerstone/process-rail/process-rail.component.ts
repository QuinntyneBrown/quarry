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
import { CsProcessStage } from '../core/process/cs-process-stage.interface';
import { RailOrientation } from './rail-orientation.type';
import { CsStageActivation } from '../core/process/cs-stage-activation.interface';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'cs-process-rail',
  templateUrl: './process-rail.component.html',
  styleUrl: './process-rail.component.scss',
})
export class ProcessRailComponent {
  readonly stages = input.required<readonly CsProcessStage[]>();
  readonly orientation = input<RailOrientation>('auto');
  readonly activated = output<CsStageActivation>();
}
