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
import { GratitudeNote } from './gratitude-note.interface';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'cs-gratitude-note',
  imports: [CardComponent],
  templateUrl: './gratitude-note.component.html',
  styleUrl: './gratitude-note.component.scss',
})
export class GratitudeNoteComponent {
  readonly note = input.required<GratitudeNote>();
}
