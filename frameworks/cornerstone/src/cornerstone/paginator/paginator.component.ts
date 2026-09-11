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
import { PageChange } from './page-change.interface';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'cs-paginator',
  imports: [CsButtonDirective],
  templateUrl: './paginator.component.html',
  styleUrl: './paginator.component.scss',
  host: { class: 'cs-cluster', role: 'navigation', 'aria-label': 'Pagination' },
})
export class PaginatorComponent {
  readonly page = input(1);
  readonly pageSize = input(25);
  readonly length = input(0);
  readonly pageSizeOptions = input<readonly number[]>([10, 25, 50, 100]);
  readonly pageChange = output<PageChange>();
  readonly pageCount = computed(() => Math.max(1, Math.ceil(this.length() / this.pageSize())));
  protected change(page: number): void {
    this.pageChange.emit({ page, pageSize: this.pageSize() });
  }
}
