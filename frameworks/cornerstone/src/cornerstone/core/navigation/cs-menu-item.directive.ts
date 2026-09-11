import { CdkMenu, CdkMenuItem } from '@angular/cdk/menu';
import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  TemplateRef,
  booleanAttribute,
  computed,
  contentChildren,
  inject,
  input,
  model,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { AvatarComponent } from '../../avatar/avatar.component';
import { BadgeComponent } from '../../badge/badge.component';
import { CsButtonDirective } from '../foundations/cs-button.directive';
import { IconComponent } from '../../icon/icon.component';
import { CsBreakpointService } from '../platform/cs-breakpoint.service';
import { CsMenuItemTrigger } from './cs-menu-item-trigger.interface';

@Directive({
  selector: '[csMenuItem]',
  hostDirectives: [CdkMenuItem],
  host: { '[class.danger]': 'danger()', '[attr.aria-disabled]': 'disabled()||null' },
})
export class CsMenuItemDirective {
  readonly id = input('');
  readonly disabled = input(false);
  readonly danger = input(false);
  readonly checkable = input(false);
  readonly checked = model(false);
  readonly triggered = output<CsMenuItemTrigger>();
}
