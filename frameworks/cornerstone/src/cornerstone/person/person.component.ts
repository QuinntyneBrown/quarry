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
import { PersonSummary } from './person-summary.interface';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'cs-person',
  imports: [AvatarComponent, BadgeComponent],
  templateUrl: './person.component.html',
  host: { class: 'cs-person' },
  styleUrl: './person.component.scss',
})
export class PersonComponent {
  readonly person = input.required<PersonSummary>();
  readonly activated = output<string>();
}
