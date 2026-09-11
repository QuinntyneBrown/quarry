import {
  ChangeDetectionStrategy,
  Component,
  Directive,
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
import { ProgressRingComponent } from '../progress-ring/progress-ring.component';
import { CheckboxComponent } from '../checkbox/checkbox.component';
import { ChoiceCardComponent } from '../choice-card/choice-card.component';
import { ChoiceGroupComponent } from '../choice-group/choice-group.component';
import { FieldComponent } from '../field/field.component';
import { CsInputDirective } from '../core/forms/cs-input.directive';
import { SearchFieldComponent } from '../search-field/search-field.component';
import { CsTextareaDirective } from '../core/forms/cs-textarea.directive';
import { CsDataState } from '../core/platform/cs-data-state.type';
import { CsIntent } from '../core/platform/cs-intent.interface';
import { CsViewModel } from '../core/platform/cs-view-model.interface';
import { PersonComponent } from '../person/person.component';
import { PersonSummary } from '../person/person-summary.interface';
import { ProgressMatrixComponent } from '../progress-matrix/progress-matrix.component';
import { StatCardComponent } from '../stat-card/stat-card.component';
import { TableContainerComponent } from '../table-container/table-container.component';
import { TableDirective } from '../table-container/table.directive';
import { TimelineComponent } from '../timeline/timeline.component';
import { TimelineEntry } from '../timeline/timeline-entry.interface';
import { JourneyLayout } from './journey-layout.type';
import { LearningJourneyView } from './learning-journey-view.interface';
import { LessonStepListComponent } from '../lesson-step-list/lesson-step-list.component';
import { LessonStepSelect } from '../lesson-step-list/lesson-step-select.interface';
import { ModuleToggle } from './module-toggle.interface';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'cs-learning-journey',
  imports: [LessonStepListComponent, ProgressBarComponent],
  templateUrl: './learning-journey.component.html',
  styleUrl: './learning-journey.component.scss',
})
export class LearningJourneyComponent {
  readonly view = input.required<LearningJourneyView>();
  readonly layout = input<JourneyLayout>('auto');
  readonly stepSelected = output<LessonStepSelect>();
  readonly moduleToggled = output<ModuleToggle>();
}
