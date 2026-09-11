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

export interface WorkItem {
  readonly id: string;
  readonly title: string;
  readonly description?: string;
  readonly status?: string;
  readonly assignee?: string;
}
