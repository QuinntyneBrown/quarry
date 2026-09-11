import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  InjectionToken,
  booleanAttribute,
  input,
  output,
} from '@angular/core';
import { CsButtonDirective } from '../foundations/cs-button.directive';
import { CardComponent } from '../../card/card.component';

export type CsBrandTreatment = 'light' | 'dark' | 'mono';
