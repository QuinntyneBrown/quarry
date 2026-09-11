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
import { MetricDelta } from './metric-delta.interface';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'cs-stat-card',
  templateUrl: './stat-card.component.html',
  host: { class: 'cs-card cs-stat' },
  styleUrl: './stat-card.component.scss',
})
export class StatCardComponent {
  private readonly format = inject(CsFormatService);
  readonly label = input.required<string>();
  readonly value = input.required<number>();
  readonly formattedValue = input('');
  readonly delta = input<MetricDelta | null>(null);
  readonly formatted = computed(() => this.formattedValue() || this.format.number(this.value()));
  readonly activated = output<void>();
}
