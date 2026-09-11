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
import { MarketingLinkGroup } from './marketing-link-group.interface';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'cs-marketing-footer',
  templateUrl: './marketing-footer.component.html',
  styleUrl: './marketing-footer.component.scss',
})
export class MarketingFooterComponent {
  readonly groups = input<readonly MarketingLinkGroup[]>([]);
}
