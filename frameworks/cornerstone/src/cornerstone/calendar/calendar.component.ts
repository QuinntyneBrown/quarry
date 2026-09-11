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
import { CalendarDate } from './calendar-date.interface';
import { CsEventViewModel } from '../core/communication/cs-event-view-model.interface';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'cs-calendar',
  templateUrl: './calendar.component.html',
  styleUrl: './calendar.component.scss',
})
export class CalendarComponent {
  readonly label = input.required<string>();
  readonly dates = input.required<readonly CalendarDate[]>();
  readonly events = input<readonly CsEventViewModel[]>([]);
  readonly selected = model<string>();
  readonly dateSelected = output<string>();
  readonly previous = output<void>();
  readonly next = output<void>();
  protected eventsFor(date: string): readonly CsEventViewModel[] {
    return this.events().filter((event) => event.start.startsWith(date));
  }
  protected select(date: string): void {
    this.selected.set(date);
    this.dateSelected.emit(date);
  }
}
