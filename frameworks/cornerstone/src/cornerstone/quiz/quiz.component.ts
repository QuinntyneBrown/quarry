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
import { QuizAnswerChange } from './quiz-answer-change.interface';
import { QuizMode } from './quiz-mode.type';
import { QuizNavigate } from './quiz-navigate.interface';
import { QuizQuestionComponent } from '../quiz-question/quiz-question.component';
import { QuizSubmit } from './quiz-submit.interface';
import { QuizView } from './quiz-view.interface';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'cs-quiz',
  imports: [QuizQuestionComponent, CsButtonDirective, ProgressBarComponent],
  templateUrl: './quiz.component.html',
  styleUrl: './quiz.component.scss',
})
export class QuizComponent {
  readonly view = input.required<QuizView>();
  readonly mode = input<QuizMode>('take');
  readonly active = computed(() => this.view().questions[this.view().activeIndex]);
  readonly answerChanged = output<QuizAnswerChange>();
  readonly navigate = output<QuizNavigate>();
  readonly submitted = output<QuizSubmit>();
}
