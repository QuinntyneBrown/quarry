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
import { AvatarComponent } from '../avatar/avatar.component';
import { BadgeComponent } from '../badge/badge.component';
import { CsButtonDirective } from '../core/foundations/cs-button.directive';
import { ProgressBarComponent } from '../progress-bar/progress-bar.component';
import { ProgressRingComponent } from '../progress-ring/progress-ring.component';
import { SkeletonComponent } from '../skeleton/skeleton.component';
import { CsDataState } from '../core/platform/cs-data-state.type';
import { CsDataStateError } from '../core/platform/cs-data-state-error.interface';
import { CsFormatService } from '../core/platform/cs-format.service';
import { CsMessageTone } from '../core/platform/cs-message-tone.type';
import { Subject } from 'rxjs';
import { EmptyStateComponent } from '../empty-state/empty-state.component';
import { StatePageCondition } from './state-page-condition.type';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'cs-state-page',
  imports: [EmptyStateComponent],
  templateUrl: './state-page.component.html',
  styleUrl: './state-page.component.scss',
})
export class StatePageComponent {
  readonly condition = input<StatePageCondition>('error');
  readonly title = input.required<string>();
  readonly message = input('');
  readonly action = output<void>();
}
