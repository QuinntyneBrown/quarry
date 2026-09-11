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
import { CsMarketingLink } from '../core/navigation/cs-marketing-link.interface';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'cs-marketing-header',
  templateUrl: './marketing-header.component.html',
  styleUrl: './marketing-header.component.scss',
})
export class MarketingHeaderComponent {
  readonly links = input<readonly CsMarketingLink[]>([]);
}
