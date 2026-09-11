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
import { DividerOrientation } from './divider-orientation.type';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'cs-divider',
  templateUrl: './divider.component.html',
  host: {
    role: 'separator',
    '[attr.aria-orientation]': 'orientation()',
    '[class]': "'cs-divider cs-divider--' + orientation()",
  },
  styleUrl: './divider.component.scss',
})
export class DividerComponent {
  readonly orientation = input<DividerOrientation>('horizontal');
}
