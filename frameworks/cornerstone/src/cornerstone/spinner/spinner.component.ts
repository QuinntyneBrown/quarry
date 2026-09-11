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
  selector: 'cs-spinner',
  templateUrl: './spinner.component.html',
  host: { role: 'status', '[attr.aria-label]': 'label()' },
  styleUrl: './spinner.component.scss',
})
export class SpinnerComponent {
  readonly label = input('Loading');
}
