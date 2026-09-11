import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  ElementRef,
  EnvironmentProviders,
  InjectionToken,
  Injectable,
  booleanAttribute,
  computed,
  inject,
  input,
  makeEnvironmentProviders,
  output,
} from '@angular/core';
import { CsIdService } from '../platform/cs-id.service';
import { CsMessageTone } from '../platform/cs-message-tone.type';
import { CsSpacingStep } from './cs-spacing-step.type';

@Directive({
  selector: '[csStack]',
  host: { class: 'cs-stack', '[style.--cs-gap]': "'var(--cs-space-' + gap() + ')'" },
})
export class CsStackDirective {
  readonly gap = input<CsSpacingStep>(4);
}
