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

export const descriptors: Record<CsBrandName, string> = {
  faithtech: 'Technology for the Church',
  liturgy: 'A FaithTech product',
  wordup: 'A FaithTech product',
};
