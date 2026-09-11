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
import { CsProcessLabels } from './cs-process-labels.interface';
import { CsProcessPalette } from './cs-process-palette.interface';

export interface CsProcessAdapter {
  readonly labels: CsProcessLabels;
  readonly palette: CsProcessPalette;
}
