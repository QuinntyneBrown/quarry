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
import { ShellSidenavMode } from './shell-sidenav-mode.type';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'cs-shell',
  templateUrl: './shell.component.html',
  host: { class: 'cs-shell' },
  styleUrl: './shell.component.scss',
})
export class ShellComponent {
  private readonly breakpoints = inject(CsBreakpointService);
  readonly opened = model(false);
  readonly mode = input<ShellSidenavMode>('auto');
  readonly compact = computed(
    () => this.mode() === 'over' || (this.mode() === 'auto' && this.breakpoints.compact()),
  );
}
