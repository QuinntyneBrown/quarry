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
import { CsAnchorPosition } from './cs-anchor-position.type';
import { CsDismissReason } from './cs-dismiss-reason.type';

@Directive({
  selector: '[csMenu]',
  hostDirectives: [CdkMenu],
  host: {
    '[attr.aria-expanded]': 'open()',
    '[attr.aria-haspopup]': '"menu"',
    '(click)': 'open.set(!open())',
  },
})
export class CsMenuDirective {
  readonly open = model(false);
  readonly position = input<CsAnchorPosition>('below-start');
  readonly opened = output<void>();
  readonly closed = output<CsDismissReason>();
}
