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
import { QuizAnswerChange } from '../quiz/quiz-answer-change.interface';
import { QuizAnswerValue } from '../quiz/quiz-answer-value.type';
import { QuizQuestionView } from './quiz-question-view.interface';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'cs-quiz-question',
  imports: [ChoiceGroupComponent, ChoiceCardComponent, CsTextareaDirective],
  templateUrl: './quiz-question.component.html',
  styleUrl: './quiz-question.component.scss',
})
export class QuizQuestionComponent {
  readonly question = input.required<QuizQuestionView>();
  readonly value = input<QuizAnswerValue>('');
  readonly answerChanged = output<QuizAnswerChange>();
  protected selected(id: string): boolean {
    return Array.isArray(this.value()) ? this.value().includes(id) : this.value() === id;
  }
  protected choose(id: string, on: boolean): void {
    if (this.question().type === 'multiple') {
      const current = Array.isArray(this.value()) ? [...this.value()] : [];
      this.change(on ? [...current, id] : current.filter((value) => value !== id));
    } else this.change(id);
  }
  protected change(value: QuizAnswerValue): void {
    this.answerChanged.emit({ questionId: this.question().id, value });
  }
}
