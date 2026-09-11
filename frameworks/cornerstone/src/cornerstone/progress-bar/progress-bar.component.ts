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
  selector: 'cs-progress-bar',
  templateUrl: './progress-bar.component.html',
  host: {
    role: 'progressbar',
    '[attr.aria-valuenow]': 'indeterminate() ? null : value()',
    '[attr.aria-valuemin]': '0',
    '[attr.aria-valuemax]': 'max()',
  },
  styleUrl: './progress-bar.component.scss',
})
export class ProgressBarComponent {
  readonly value = input(0);
  readonly max = input(100);
  readonly indeterminate = input(false);
  readonly percentage = computed(() =>
    Math.max(0, Math.min(100, (this.value() / Math.max(1, this.max())) * 100)),
  );
}
