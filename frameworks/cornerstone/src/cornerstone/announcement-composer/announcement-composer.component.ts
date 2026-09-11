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
import { AnnouncementDraft } from './announcement-draft.interface';
import { AudienceOption } from './audience-option.interface';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'cs-announcement-composer',
  imports: [
    FieldComponent,
    CsInputDirective,
    CsTextareaDirective,
    DateTimeFieldComponent,
    CsButtonDirective,
  ],
  templateUrl: './announcement-composer.component.html',
  styleUrl: './announcement-composer.component.scss',
})
export class AnnouncementComposerComponent {
  readonly audiences = input.required<readonly AudienceOption[]>();
  readonly value = model.required<AnnouncementDraft>();
  readonly submitted = output<AnnouncementDraft>();
  readonly previewRequested = output<AnnouncementDraft>();
  protected submit(e: Event): void {
    e.preventDefault();
    this.submitted.emit(this.value());
  }
}
