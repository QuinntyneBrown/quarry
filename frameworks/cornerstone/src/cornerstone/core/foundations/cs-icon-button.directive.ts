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
import { CsButtonAppearance } from './cs-button-appearance.type';

@Directive({
  selector: 'button[csIconButton],a[csIconButton]',
  host: {
    class: 'cs-button cs-icon-button',
    '[attr.aria-label]': 'label()',
    '[class.cs-button--danger]': "appearance() === 'danger'",
  },
})
export class CsIconButtonDirective {
  readonly label = input.required<string>();
  readonly appearance = input<CsButtonAppearance>('ghost');
}
