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
import { TabComponent } from '../tab/tab.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'cs-tab-group',
  imports: [NgTemplateOutlet],
  templateUrl: './tab-group.component.html',
  styleUrl: './tab-group.component.scss',
})
export class TabGroupComponent {
  readonly tabs = contentChildren(TabComponent);
  readonly selectedIndex = model(0);
  readonly selected = output<number>();
  readonly activeTab = computed(() => this.tabs()[this.selectedIndex()]);
  protected select(i: number): void {
    if (!this.tabs()[i]?.disabled()) {
      this.selectedIndex.set(i);
      this.selected.emit(i);
    }
  }
  protected keydown(e: KeyboardEvent): void {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
    e.preventDefault();
    const length = this.tabs().length;
    const next =
      e.key === 'Home'
        ? 0
        : e.key === 'End'
          ? length - 1
          : (this.selectedIndex() + (e.key === 'ArrowLeft' ? -1 : 1) + length) % length;
    this.select(next);
  }
}
