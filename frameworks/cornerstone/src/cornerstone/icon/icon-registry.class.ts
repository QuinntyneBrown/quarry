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
import { ICONS } from './icons.token';
import { IconDefinition } from './icon-definition.interface';
import { IconSet } from './icon-set.interface';

@Injectable({ providedIn: 'root' })
export class IconRegistry {
  private readonly icons = new Map<string, IconDefinition>();
  constructor() {
    for (const set of inject(ICONS)) for (const icon of set.icons) this.icons.set(icon.name, icon);
  }
  register(icon: IconDefinition): void {
    this.icons.set(icon.name, icon);
  }
  registerSet(set: IconSet): void {
    for (const icon of set.icons) this.register(icon);
  }
  get(name: string): IconDefinition | undefined {
    return this.icons.get(name);
  }
}
