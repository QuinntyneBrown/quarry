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
  selector: 'cs-alert',
  templateUrl: './alert.component.html',
  styleUrl: './alert.component.scss',
  host: { role: 'status', '[class]': "'cs-alert cs-tone--' + tone()" },
})
export class AlertComponent {
  readonly title = input('');
  readonly tone = input<CsMessageTone>('info');
}
