import { LiveAnnouncer } from '@angular/cdk/a11y';
import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  Injectable,
  TemplateRef,
  booleanAttribute,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { AvatarComponent } from '../../avatar/avatar.component';
import { BadgeComponent } from '../../badge/badge.component';
import { CsButtonDirective } from '../foundations/cs-button.directive';
import { ProgressBarComponent } from '../../progress-bar/progress-bar.component';
import { ProgressRingComponent } from '../../progress-ring/progress-ring.component';
import { SkeletonComponent } from '../../skeleton/skeleton.component';
import { CsDataState } from '../platform/cs-data-state.type';
import { CsDataStateError } from '../platform/cs-data-state-error.interface';
import { CsFormatService } from '../platform/cs-format.service';
import { CsMessageTone } from '../platform/cs-message-tone.type';
import { Subject } from 'rxjs';
import { CsMetricTone } from './cs-metric-tone.type';

export interface CsMetricSeries {
  readonly label: string;
  readonly values: readonly number[];
  readonly tone?: CsMetricTone;
}
