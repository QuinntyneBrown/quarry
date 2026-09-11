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
import { BrandLockupVariant } from './brand-lockup-variant.type';
import { CsBrandName } from '../core/marketing/cs-brand-name.type';
import { CsBrandSize } from '../core/marketing/cs-brand-size.type';
import { CsBrandTreatment } from '../core/marketing/cs-brand-treatment.type';
import { LogoMarkComponent } from '../logo-mark/logo-mark.component';
import { descriptors } from './descriptors.constant';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'cs-brand-lockup',
  imports: [LogoMarkComponent],
  templateUrl: './brand-lockup.component.html',
  styleUrl: './brand-lockup.component.scss',
})
export class BrandLockupComponent {
  readonly brand = input<CsBrandName>('faithtech');
  readonly variant = input<BrandLockupVariant>('full');
  readonly treatment = input<CsBrandTreatment>();
  readonly size = input<CsBrandSize>('medium');
  readonly orientation = input<'horizontal' | 'stacked'>('horizontal');
  readonly href = input<string | null>(null);
  readonly descriptors = descriptors;
  readonly wordmark = () =>
    this.brand() === 'wordup' ? 'Word Up' : this.brand()[0]!.toUpperCase() + this.brand().slice(1);
}
