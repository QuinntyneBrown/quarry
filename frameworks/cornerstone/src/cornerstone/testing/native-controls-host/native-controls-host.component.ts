import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { CsButtonDirective } from '../../core/foundations/cs-button.directive';
import { CsSelectDirective } from '../../core/forms/cs-select.directive';

@Component({
  selector: 'cs-native-controls-host',
  imports: [CsButtonDirective, CsSelectDirective, ReactiveFormsModule],
  templateUrl: './native-controls-host.component.html',
  styleUrl: './native-controls-host.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NativeControlsHostComponent {
  readonly disabled = signal(false);
  readonly selected = signal('b');
  readonly control = new FormControl('b');
  readonly clicks = signal(0);
}
