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

@Directive({ selector: '[csAuthAlternate]' })
export class AuthAlternateDirective {}
