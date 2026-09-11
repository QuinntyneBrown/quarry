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
import { CS_PROCESS_ADAPTER } from './cs-process-adapter.token';
import { CsProcessAdapter } from './cs-process-adapter.interface';

export function provideCsProcessAdapter(adapter: CsProcessAdapter): Provider {
  return { provide: CS_PROCESS_ADAPTER, useValue: adapter };
}
