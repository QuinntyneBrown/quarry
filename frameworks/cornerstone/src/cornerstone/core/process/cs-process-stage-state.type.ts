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

export type CsProcessStageState = 'complete' | 'current' | 'available' | 'locked' | 'error';
