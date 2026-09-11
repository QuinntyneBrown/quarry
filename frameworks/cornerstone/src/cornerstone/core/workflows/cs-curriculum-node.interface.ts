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
import { AvatarComponent } from '../../avatar/avatar.component';
import { BadgeComponent } from '../../badge/badge.component';
import { CsButtonDirective } from '../foundations/cs-button.directive';
import { CardComponent } from '../../card/card.component';
import { ProgressBarComponent } from '../../progress-bar/progress-bar.component';
import { ProgressRingComponent } from '../../progress-ring/progress-ring.component';
import { CheckboxComponent } from '../../checkbox/checkbox.component';
import { ChoiceCardComponent } from '../../choice-card/choice-card.component';
import { ChoiceGroupComponent } from '../../choice-group/choice-group.component';
import { FieldComponent } from '../../field/field.component';
import { CsInputDirective } from '../forms/cs-input.directive';
import { SearchFieldComponent } from '../../search-field/search-field.component';
import { CsTextareaDirective } from '../forms/cs-textarea.directive';
import { CsDataState } from '../platform/cs-data-state.type';
import { CsIntent } from '../platform/cs-intent.interface';
import { CsViewModel } from '../platform/cs-view-model.interface';
import { PersonComponent } from '../../person/person.component';
import { PersonSummary } from '../../person/person-summary.interface';
import { ProgressMatrixComponent } from '../../progress-matrix/progress-matrix.component';
import { StatCardComponent } from '../../stat-card/stat-card.component';
import { TableContainerComponent } from '../../table-container/table-container.component';
import { TableDirective } from '../../table-container/table.directive';
import { TimelineComponent } from '../../timeline/timeline.component';
import { TimelineEntry } from '../../timeline/timeline-entry.interface';
import { CsCurriculumNodeKind } from './cs-curriculum-node-kind.type';
import { CsCurriculumNodeState } from './cs-curriculum-node-state.type';

export interface CsCurriculumNode {
  readonly id: string;
  readonly parentId?: string;
  readonly label: string;
  readonly kind: CsCurriculumNodeKind;
  readonly state: CsCurriculumNodeState;
  readonly children?: readonly CsCurriculumNode[];
}
