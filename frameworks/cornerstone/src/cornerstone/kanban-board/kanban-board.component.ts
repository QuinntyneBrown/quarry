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
import { KanbanColumn } from '../kanban-column/kanban-column.interface';
import { KanbanColumnComponent } from '../kanban-column/kanban-column.component';
import { WorkItemMoveIntent } from './work-item-move-intent.interface';
import { WorkItemOpenIntent } from '../work-item-card/work-item-open-intent.interface';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'cs-kanban-board',
  imports: [KanbanColumnComponent],
  templateUrl: './kanban-board.component.html',
  styleUrl: './kanban-board.component.scss',
})
export class KanbanBoardComponent {
  readonly columns = input.required<readonly KanbanColumn[]>();
  readonly moved = output<WorkItemMoveIntent>();
  readonly opened = output<WorkItemOpenIntent>();
}
