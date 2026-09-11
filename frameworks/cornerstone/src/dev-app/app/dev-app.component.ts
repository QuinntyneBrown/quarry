import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { BadgeComponent, CardComponent, CsButtonDirective } from '@quinntyne/cornerstone';

@Component({
  selector: 'cs-dev-app',
  imports: [BadgeComponent, CardComponent, CsButtonDirective],
  templateUrl: './dev-app.component.html',
  styleUrl: './dev-app.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DevAppComponent {
  protected readonly completed = signal(false);
}
