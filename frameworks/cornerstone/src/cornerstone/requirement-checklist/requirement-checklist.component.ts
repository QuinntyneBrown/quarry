import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  InjectionToken,
  Provider,
  computed,
  input,
  output,
} from '@angular/core';
import { BadgeComponent } from '../badge/badge.component';
import { CsButtonDirective } from '../core/foundations/cs-button.directive';
import { CardComponent } from '../card/card.component';
import { ProgressRingComponent } from '../progress-ring/progress-ring.component';
import { CheckboxComponent } from '../checkbox/checkbox.component';
import { CsRequirement } from '../core/process/cs-requirement.interface';
import { CsRequirementToggleIntent } from '../core/process/cs-requirement-toggle-intent.interface';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'cs-requirement-checklist',
  imports: [CheckboxComponent],
  templateUrl: './requirement-checklist.component.html',
  styleUrl: './requirement-checklist.component.scss',
})
export class RequirementChecklistComponent {
  readonly requirements = input.required<readonly CsRequirement[]>();
  readonly toggled = output<CsRequirementToggleIntent>();
}
