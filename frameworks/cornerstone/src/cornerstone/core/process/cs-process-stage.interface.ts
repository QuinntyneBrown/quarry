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
import { BadgeComponent } from '../../badge/badge.component';
import { CsButtonDirective } from '../foundations/cs-button.directive';
import { CardComponent } from '../../card/card.component';
import { ProgressRingComponent } from '../../progress-ring/progress-ring.component';
import { CheckboxComponent } from '../../checkbox/checkbox.component';
import { CsProcessStageState } from './cs-process-stage-state.type';

export interface CsProcessStage {
  readonly id: string;
  readonly label: string;
  readonly description?: string;
  readonly state: CsProcessStageState;
  readonly actionLabel?: string;
}
