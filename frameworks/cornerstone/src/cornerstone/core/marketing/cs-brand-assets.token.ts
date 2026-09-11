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
import { CsBrandAssets } from './cs-brand-assets.type';

export const CS_BRAND_ASSETS = new InjectionToken<CsBrandAssets>('CS_BRAND_ASSETS');
