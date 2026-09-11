import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TabComponent } from '../../tab/tab.component';
import { TabGroupComponent } from '../../tab-group/tab-group.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TabComponent, TabGroupComponent],
  templateUrl: './tabs-host.component.html',
  styleUrl: './tabs-host.component.scss',
})
export class TabsHostComponent {}
