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
import { CsIdService } from '../core/platform/cs-id.service';
import { CsMessageTone } from '../core/platform/cs-message-tone.type';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'cs-button-group',
  templateUrl: './button-group.component.html',
  host: { class: 'cs-button-group', role: 'group' },
  styleUrl: './button-group.component.scss',
})
export class ButtonGroupComponent {
  readonly mode = input<'related' | 'split'>('related');
}
