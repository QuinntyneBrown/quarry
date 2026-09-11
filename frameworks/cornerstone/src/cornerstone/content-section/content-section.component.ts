import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  InjectionToken,
  booleanAttribute,
  input,
  output,
} from '@angular/core';
import { CsButtonDirective } from '../core/foundations/cs-button.directive';
import { CardComponent } from '../card/card.component';
import { ContentSectionVariant } from './content-section-variant.type';
import { SectionCard } from './section-card.interface';
import { SectionStat } from './section-stat.interface';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'cs-content-section',
  imports: [CardComponent],
  templateUrl: './content-section.component.html',
  styleUrl: './content-section.component.scss',
})
export class ContentSectionComponent {
  readonly title = input.required<string>();
  readonly summary = input('');
  readonly variant = input<ContentSectionVariant>('plain');
  readonly cards = input<readonly SectionCard[]>([]);
  readonly stats = input<readonly SectionStat[]>([]);
}
