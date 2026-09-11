import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CsButtonDirective } from '../../core/foundations/cs-button.directive';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CsButtonDirective],
  templateUrl: './button-host.component.html',
  styleUrl: './button-host.component.scss',
})
export class ButtonHostComponent {}
