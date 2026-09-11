import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  CountdownComponent,
  ReviewDialogComponent,
  TeamBoardComponent,
  RaffleStageComponent,
  CsButtonDirective,
  BoardGroup,
  BoardMember,
  RaffleResult,
  MemberMove,
  ProjectAssignment,
} from '@quinntyne/cornerstone';

@Component({
  selector: 'cs-event-components-fixture',
  imports: [
    CountdownComponent,
    ReviewDialogComponent,
    TeamBoardComponent,
    RaffleStageComponent,
    CsButtonDirective,
  ],
  templateUrl: './event-components-fixture.component.html',
  styleUrl: './event-components-fixture.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EventComponentsFixtureComponent {
  readonly clock = signal(1000);
  readonly dialogOpen = signal(false);
  readonly closeCount = signal(0);
  readonly editable = signal(true);
  readonly disabled = signal(false);
  readonly moveLog = signal('');
  readonly assignmentLog = signal('');
  readonly createLog = signal('');
  readonly groups: BoardGroup[] = [
    { id: 'a', name: 'Team A', projectId: '' },
    { id: 'b', name: 'Team B', projectId: '' },
  ];
  readonly members: BoardMember[] = [{ id: 'ada', name: 'Ada', label: 'Developer', groupId: 'a' }];
  readonly projects = [{ id: 'directory', title: 'Community directory' }];
  readonly result = signal<RaffleResult>({
    id: 'initial',
    label: 'Ada · Ticket 01',
    candidates: ['Ada', 'Grace'],
    start: 0,
    reveal: 2000,
  });
  readonly forcedFallback = signal(true);
  close(): void {
    this.dialogOpen.set(false);
    this.closeCount.update((count) => count + 1);
  }
  move(event: MemberMove): void {
    this.moveLog.set(`${event.memberId}:${event.groupId}`);
  }
  assign(event: ProjectAssignment): void {
    this.assignmentLog.set(`${event.groupId}:${event.projectId}`);
  }
  lateDraw(): void {
    this.result.set({
      id: 'late',
      label: 'Grace · Ticket 02',
      candidates: [],
      start: 0,
      reveal: 500,
    });
  }
}
