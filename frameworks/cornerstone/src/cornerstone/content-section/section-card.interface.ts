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

export interface SectionCard {
  readonly id: string;
  readonly title: string;
  readonly body: string;
  readonly href?: string;
}
