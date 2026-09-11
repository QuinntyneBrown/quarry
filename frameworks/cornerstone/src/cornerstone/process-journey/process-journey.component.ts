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
import { ProcessRailComponent } from '../process-rail/process-rail.component';
import { CsProcessStage } from '../core/process/cs-process-stage.interface';
import { RailOrientation } from '../process-rail/rail-orientation.type';
import { StageActionIntent } from './stage-action-intent.interface';
import { CsStageActivation } from '../core/process/cs-stage-activation.interface';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'cs-process-journey',
  imports: [ProcessRailComponent],
  templateUrl: './process-journey.component.html',
  styleUrl: './process-journey.component.scss',
})
export class ProcessJourneyComponent {
  readonly stages = input.required<readonly CsProcessStage[]>();
  readonly orientation = input<RailOrientation>('auto');
  readonly activated = output<CsStageActivation>();
  readonly action = output<StageActionIntent>();
}
