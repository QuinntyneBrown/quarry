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

export interface HeroAction {
  readonly id: string;
  readonly label: string;
  readonly href?: string;
  readonly appearance?: 'primary' | 'secondary';
}
