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
  selector: 'cs-progress-ring',
  templateUrl: './progress-ring.component.html',
  host: { role: 'progressbar', '[attr.aria-valuenow]': 'value()', '[attr.aria-valuemax]': 'max()' },
  styleUrl: './progress-ring.component.scss',
})
export class ProgressRingComponent {
  readonly value = input(0);
  readonly max = input(100);
  readonly percentage = computed(() => Math.round((this.value() / Math.max(1, this.max())) * 100));
}
