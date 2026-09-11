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
import { AuthLayoutVariant } from './auth-layout-variant.type';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'cs-auth-layout',
  templateUrl: './auth-layout.component.html',
  styleUrl: './auth-layout.component.scss',
})
export class AuthLayoutComponent {
  readonly variant = input<AuthLayoutVariant>('centered');
}
