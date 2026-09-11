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
import { RecordSection } from './record-section.interface';
import { RecordSectionChange } from './record-section-change.interface';
import { RecordTabsOrientation } from './record-tabs-orientation.type';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'cs-record-tabs',
  templateUrl: './record-tabs.component.html',
  styleUrl: './record-tabs.component.scss',
})
export class RecordTabsComponent {
  readonly sections = input.required<readonly RecordSection[]>();
  readonly active = model.required<string>();
  readonly orientation = input<RecordTabsOrientation>('horizontal');
  readonly changed = output<RecordSectionChange>();
  protected select(sectionId: string): void {
    this.active.set(sectionId);
    this.changed.emit({ sectionId });
  }
}
