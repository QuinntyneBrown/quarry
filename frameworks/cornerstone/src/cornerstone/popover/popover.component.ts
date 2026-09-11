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
import { AvatarComponent } from '../avatar/avatar.component';
import { BadgeComponent } from '../badge/badge.component';
import { CsButtonDirective } from '../core/foundations/cs-button.directive';
import { IconComponent } from '../icon/icon.component';
import { CsBreakpointService } from '../core/platform/cs-breakpoint.service';
import { CsAnchorPosition } from '../core/navigation/cs-anchor-position.type';
import { CsDismissReason } from '../core/navigation/cs-dismiss-reason.type';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'cs-popover',
  templateUrl: './popover.component.html',
  styleUrl: './popover.component.scss',
})
export class PopoverComponent {
  readonly open = model(false);
  readonly position = input<CsAnchorPosition>('below-start');
  readonly trapFocus = input(false);
  readonly ariaLabel = input('');
  readonly closed = output<CsDismissReason>();
}
