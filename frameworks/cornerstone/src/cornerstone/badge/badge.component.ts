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
  selector: 'cs-badge',
  templateUrl: './badge.component.html',
  styleUrl: './badge.component.scss',
  host: { '[class]': "'cs-badge cs-tone--' + tone()" },
})
export class BadgeComponent {
  readonly tone = input<CsMessageTone>('neutral');
}
