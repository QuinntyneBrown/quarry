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
import { Crumb } from './crumb.interface';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'cs-breadcrumbs',
  templateUrl: './breadcrumbs.component.html',
  styleUrl: './breadcrumbs.component.scss',
})
export class BreadcrumbsComponent {
  readonly crumbs = input.required<readonly Crumb[]>();
  readonly maxVisible = input(4);
  readonly separator = input('/');
  readonly visible = computed(() =>
    this.crumbs().length <= this.maxVisible()
      ? this.crumbs()
      : [this.crumbs()[0]!, { label: '…' }, ...this.crumbs().slice(-(this.maxVisible() - 2))],
  );
}
