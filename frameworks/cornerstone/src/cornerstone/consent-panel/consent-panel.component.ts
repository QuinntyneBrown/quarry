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
import { ConsentContactUpdateIntent } from './consent-contact-update-intent.interface';
import { ConsentDecisionIntent } from './consent-decision-intent.interface';
import { ConsentPanelViewModel } from './consent-panel-view-model.interface';
import { ConsentRevokeIntent } from './consent-revoke-intent.interface';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'cs-consent-panel',
  imports: [BadgeComponent, ChoiceGroupComponent, ChoiceCardComponent],
  templateUrl: './consent-panel.component.html',
  styleUrl: './consent-panel.component.scss',
})
export class ConsentPanelComponent {
  readonly view = input.required<ConsentPanelViewModel>();
  readonly decision = output<ConsentDecisionIntent>();
  readonly revoke = output<ConsentRevokeIntent>();
  readonly contactUpdate = output<ConsentContactUpdateIntent>();
}
