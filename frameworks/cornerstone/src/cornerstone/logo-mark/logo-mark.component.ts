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
import { CsBrandName } from '../core/marketing/cs-brand-name.type';
import { CsBrandSize } from '../core/marketing/cs-brand-size.type';
import { CsBrandTreatment } from '../core/marketing/cs-brand-treatment.type';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'cs-logo-mark',
  templateUrl: './logo-mark.component.html',
  host: { '[class]': "'cs-logo-mark cs-logo-mark--'+brand()+' cs-logo-mark--'+size()" },
  styleUrl: './logo-mark.component.scss',
})
export class LogoMarkComponent {
  readonly brand = input<CsBrandName>('faithtech');
  readonly size = input<CsBrandSize>('medium');
  readonly treatment = input<CsBrandTreatment>();
  readonly label = input('');
}
