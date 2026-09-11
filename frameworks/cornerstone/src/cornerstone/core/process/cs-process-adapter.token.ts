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
import { CsProcessAdapter } from './cs-process-adapter.interface';

export const CS_PROCESS_ADAPTER = new InjectionToken<CsProcessAdapter>('CS_PROCESS_ADAPTER');
