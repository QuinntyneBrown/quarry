import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import {
  CdkDrag,
  CdkDragDrop,
  CdkDragHandle,
  CdkDropList,
  CdkDropListGroup,
} from '@angular/cdk/drag-drop';
import { CardComponent } from '../card/card.component';
import { BadgeComponent } from '../badge/badge.component';
import { CsButtonDirective } from '../core/foundations/cs-button.directive';
import { CsSelectDirective } from '../core/forms/cs-select.directive';
import { CsIdService } from '../core/platform/cs-id.service';
import { BoardGroup } from './board-group.interface';
import { BoardMember } from './board-member.interface';
import { BoardProject } from './board-project.interface';
import { MemberMove } from './member-move.interface';
import { ProjectAssignment } from './project-assignment.interface';
import { NewTeamRequest } from './new-team-request.interface';
import { TeamBoardText } from './team-board-text.interface';
import { teamBoardText } from './team-board-text.constant';

/** Controlled team membership and project assignment; emits intent without persistence. */
@Component({
  selector: 'cs-team-board',
  imports: [
    CdkDrag,
    CdkDragHandle,
    CdkDropList,
    CdkDropListGroup,
    CardComponent,
    BadgeComponent,
    CsButtonDirective,
    CsSelectDirective,
  ],
  templateUrl: './team-board.component.html',
  styleUrl: './team-board.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeamBoardComponent {
  readonly groups = input.required<readonly BoardGroup[]>();
  readonly members = input.required<readonly BoardMember[]>();
  readonly projects = input<readonly BoardProject[]>([]);
  readonly editable = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly currentMember = input('');
  readonly text = input<Partial<TeamBoardText>>({});
  readonly moved = output<MemberMove>();
  readonly assigned = output<ProjectAssignment>();
  readonly newTeamRequested = output<NewTeamRequest>();
  protected readonly labels = computed(() => ({ ...teamBoardText, ...this.text() }));
  protected readonly id = inject(CsIdService).next('team-board');
  protected readonly peopleByGroup = computed(() => {
    const groups = new Map<string, BoardMember[]>();
    for (const member of this.members()) {
      const group = groups.get(member.groupId) ?? [];
      group.push(member);
      groups.set(member.groupId, group);
    }
    return groups;
  });
  protected people(id: string): readonly BoardMember[] {
    return this.peopleByGroup().get(id) ?? [];
  }
  protected project(id: string): string {
    return this.projects().find((project) => project.id === id)?.title || this.labels().noProject;
  }
  protected controlId(kind: string, index: number): string {
    return `${this.id}-${kind}-${index}`;
  }
  protected drop(event: CdkDragDrop<string, string, string>): void {
    if (event.previousContainer.data !== event.container.data)
      this.moveMember(event.item.data, event.container.data);
  }
  moveMember(memberId: string, groupId: string): void {
    const member = this.members().find((item) => item.id === memberId);
    if (
      !this.editable() ||
      this.disabled() ||
      !member ||
      member.groupId === groupId ||
      !this.groups().some((group) => group.id === groupId)
    )
      return;
    this.moved.emit({ memberId, groupId });
  }
  protected move(member: BoardMember, event: Event, control: CsSelectDirective): void {
    const select = event.target as HTMLSelectElement;
    this.moveMember(member.id, select.value);
    control.writeValue(member.groupId);
    select.value = member.groupId;
  }
  assignProject(groupId: string, projectId: string): void {
    const group = this.groups().find((item) => item.id === groupId);
    if (
      !this.editable() ||
      this.disabled() ||
      !group?.id ||
      group.projectId === projectId ||
      (projectId !== '' && !this.projects().some((project) => project.id === projectId))
    )
      return;
    this.assigned.emit({ groupId, projectId });
  }
  protected assign(group: BoardGroup, event: Event, control: CsSelectDirective): void {
    const select = event.target as HTMLSelectElement;
    this.assignProject(group.id, select.value);
    control.writeValue(group.projectId);
    select.value = group.projectId;
  }
  requestNewTeam(memberId: string): void {
    if (
      this.editable() &&
      !this.disabled() &&
      this.members().some((member) => member.id === memberId)
    )
      this.newTeamRequested.emit({ memberId });
  }
}
