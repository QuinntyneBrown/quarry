import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { CheckboxComponent } from '../../checkbox/checkbox.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CheckboxComponent, ReactiveFormsModule],
  templateUrl: './checkbox-host.component.html',
  styleUrl: './checkbox-host.component.scss',
})
export class CheckboxHostComponent {
  readonly control = new FormControl(false, { nonNullable: true });
}
