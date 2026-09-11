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
  selector: 'cs-action-bar',
  templateUrl: './action-bar.component.html',
  host: { class: 'cs-action-bar' },
  styleUrl: './action-bar.component.scss',
})
export class ActionBarComponent {
  readonly sticky = input(false, { transform: booleanAttribute });
}
