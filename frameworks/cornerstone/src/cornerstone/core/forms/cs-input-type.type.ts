import { CdkTextareaAutosize } from '@angular/cdk/text-field';
import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  ElementRef,
  Provider,
  booleanAttribute,
  computed,
  forwardRef,
  inject,
  input,
  model,
  output,
  signal,
} from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { CsButtonDirective } from '../foundations/cs-button.directive';
import { CsControlBase } from '../platform/cs-control-base.class';
import { CsIdService } from '../platform/cs-id.service';
import { CsLocalizationService } from '../platform/cs-localization.service';

export type CsInputType = 'text' | 'email' | 'password' | 'number' | 'url' | 'tel' | 'search';
