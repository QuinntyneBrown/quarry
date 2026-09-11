import { ClipboardModule } from '@angular/cdk/clipboard';
import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  Pipe,
  PipeTransform,
  booleanAttribute,
  computed,
  input,
  model,
  output,
  signal,
} from '@angular/core';
import { AvatarComponent } from '../../avatar/avatar.component';
import { BadgeComponent } from '../../badge/badge.component';
import { CsButtonDirective } from '../foundations/cs-button.directive';
import { CardComponent } from '../../card/card.component';
import { ProgressBarComponent } from '../../progress-bar/progress-bar.component';
import { ChoiceGroupComponent } from '../../choice-group/choice-group.component';
import { DateTimeFieldComponent } from '../../date-time-field/date-time-field.component';
import { FieldComponent } from '../../field/field.component';
import { CsInputDirective } from '../forms/cs-input.directive';
import { SearchFieldComponent } from '../../search-field/search-field.component';
import { CsTextareaDirective } from '../forms/cs-textarea.directive';
import { CsDataState } from '../platform/cs-data-state.type';
import { csSafeUrl } from '../platform/cs-safe-url.function';

export interface CsEventViewModel {
  readonly id: string;
  readonly title: string;
  readonly start: string;
  readonly end?: string;
  readonly location?: string;
  readonly status?: string;
}
