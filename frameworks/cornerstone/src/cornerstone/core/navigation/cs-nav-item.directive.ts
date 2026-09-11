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
import { CsNavItemActivation } from './cs-nav-item-activation.interface';

@Directive({
  selector: 'a[csNavItem],button[csNavItem]',
  host: {
    class: 'cs-nav-item',
    '[class.active]': 'active()',
    '[attr.aria-current]': "active()?'page':null",
    '[attr.aria-disabled]': 'disabled()||null',
    '(click)': 'activate($event)',
  },
})
export class CsNavItemDirective {
  readonly id = input.required<string>();
  readonly active = input(false);
  readonly disabled = input(false);
  readonly activated = output<CsNavItemActivation>();
  protected activate(event: Event): void {
    if (this.disabled()) {
      event.preventDefault();
      return;
    }
    this.activated.emit({
      id: this.id(),
      source: event instanceof KeyboardEvent ? 'keyboard' : 'pointer',
    });
  }
}
