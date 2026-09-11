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
import { AvatarComponent } from '../avatar/avatar.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'cs-avatar-stack',
  templateUrl: './avatar-stack.component.html',
  imports: [AvatarComponent],
  host: { class: 'cs-avatar-stack' },
  styleUrl: './avatar-stack.component.scss',
})
export class AvatarStackComponent {
  readonly people = input.required<readonly { id: string; name: string; src?: string }[]>();
  readonly max = input(4);
}
