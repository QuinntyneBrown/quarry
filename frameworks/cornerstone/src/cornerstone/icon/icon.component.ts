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
import { IconName } from './icon-name.type';
import { IconRegistry } from './icon-registry.class';
import { IconSize } from './icon-size.type';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'cs-icon',
  templateUrl: './icon.component.html',
  host: {
    '[class]': "'cs-icon cs-icon--' + size()",
    '[attr.data-missing]': 'definition() ? null : name()',
  },
  styleUrl: './icon.component.scss',
})
export class IconComponent {
  private readonly registry = inject(IconRegistry);
  readonly name = input.required<IconName>();
  readonly label = input('');
  readonly size = input<IconSize>('medium');
  readonly fill = input(false, { transform: booleanAttribute });
  readonly definition = computed(() => this.registry.get(this.name()));
}
