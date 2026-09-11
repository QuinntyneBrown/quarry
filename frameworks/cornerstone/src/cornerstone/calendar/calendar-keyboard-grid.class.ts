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
import { AvatarComponent } from '../avatar/avatar.component';
import { BadgeComponent } from '../badge/badge.component';
import { CsButtonDirective } from '../core/foundations/cs-button.directive';
import { CardComponent } from '../card/card.component';
import { ProgressBarComponent } from '../progress-bar/progress-bar.component';
import { ChoiceGroupComponent } from '../choice-group/choice-group.component';
import { DateTimeFieldComponent } from '../date-time-field/date-time-field.component';
import { FieldComponent } from '../field/field.component';
import { CsInputDirective } from '../core/forms/cs-input.directive';
import { SearchFieldComponent } from '../search-field/search-field.component';
import { CsTextareaDirective } from '../core/forms/cs-textarea.directive';
import { CsDataState } from '../core/platform/cs-data-state.type';
import { csSafeUrl } from '../core/platform/cs-safe-url.function';

export class CalendarKeyboardGrid {}
