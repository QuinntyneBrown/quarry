// Traces to: L2-192
import { TestBed } from '@angular/core/testing';
import { TeamBoardComponent } from './team-board.component';

describe('team board intents', () => {
  it('guards project and new-team requests and permits a real group named new', () => {
    const fixture = TestBed.createComponent(TeamBoardComponent);
    fixture.componentRef.setInput('groups', [{ id: 'new', name: 'New', projectId: '' }]);
    fixture.componentRef.setInput('members', [{ id: 'ada', name: 'Ada', label: '', groupId: '' }]);
    fixture.componentRef.setInput('projects', [{ id: 'directory', title: 'Directory' }]);
    const assigned = vi.fn();
    const created = vi.fn();
    const moved = vi.fn();
    fixture.componentInstance.assigned.subscribe(assigned);
    fixture.componentInstance.newTeamRequested.subscribe(created);
    fixture.componentInstance.moved.subscribe(moved);
    fixture.detectChanges();
    fixture.componentInstance.assignProject('new', 'directory');
    fixture.componentInstance.requestNewTeam('ada');
    expect(assigned).not.toHaveBeenCalled();
    expect(created).not.toHaveBeenCalled();
    fixture.componentRef.setInput('editable', true);
    fixture.componentInstance.assignProject('new', 'missing');
    fixture.componentInstance.assignProject('missing', 'directory');
    fixture.componentInstance.requestNewTeam('missing');
    expect(assigned).not.toHaveBeenCalled();
    expect(created).not.toHaveBeenCalled();
    fixture.componentInstance.assignProject('new', 'directory');
    fixture.componentInstance.requestNewTeam('ada');
    fixture.componentInstance.moveMember('ada', 'new');
    expect(assigned).toHaveBeenCalledExactlyOnceWith({ groupId: 'new', projectId: 'directory' });
    expect(created).toHaveBeenCalledExactlyOnceWith({ memberId: 'ada' });
    expect(moved).toHaveBeenCalledExactlyOnceWith({ memberId: 'ada', groupId: 'new' });
    fixture.componentRef.setInput('disabled', true);
    fixture.componentInstance.assignProject('new', 'directory');
    fixture.componentInstance.requestNewTeam('ada');
    expect(assigned).toHaveBeenCalledOnce();
    expect(created).toHaveBeenCalledOnce();
  });
  it('keeps inputs controlled and guards disabled, unchanged, and invalid moves', () => {
    const fixture = TestBed.createComponent(TeamBoardComponent);
    const member = Object.freeze({ id: 'p1', name: 'Ada', label: 'Developer', groupId: 'a' });
    fixture.componentRef.setInput('groups', [
      { id: 'a', name: 'A', projectId: '' },
      { id: 'b', name: 'B', projectId: '' },
    ]);
    fixture.componentRef.setInput('members', Object.freeze([member]));
    fixture.componentRef.setInput('editable', true);
    const moved = vi.fn();
    fixture.componentInstance.moved.subscribe(moved);
    fixture.detectChanges();
    fixture.componentInstance.moveMember(member.id, 'b');
    expect(moved).toHaveBeenCalledExactlyOnceWith({ memberId: 'p1', groupId: 'b' });
    expect(member.groupId).toBe('a');
    fixture.componentInstance.moveMember(member.id, 'a');
    fixture.componentInstance.moveMember(member.id, 'missing');
    fixture.componentRef.setInput('disabled', true);
    fixture.componentInstance.moveMember(member.id, 'b');
    expect(moved).toHaveBeenCalledTimes(1);
  });

  it('keeps native selects at the supplied values until the parent accepts an intent', () => {
    const fixture = TestBed.createComponent(TeamBoardComponent);
    fixture.componentRef.setInput('groups', [
      { id: 'a', name: 'A', projectId: '' },
      { id: 'b', name: 'B', projectId: '' },
    ]);
    fixture.componentRef.setInput('members', [
      { id: 'p1', name: 'Ada', label: 'Developer', groupId: 'a' },
    ]);
    fixture.componentRef.setInput('editable', true);
    fixture.detectChanges();
    const select: HTMLSelectElement = fixture.nativeElement.querySelector('.member select');
    select.value = 'b';
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(select.value).toBe('a');
  });
});
