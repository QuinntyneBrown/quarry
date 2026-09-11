import { LiveAnnouncer } from '@angular/cdk/a11y';
import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  Injectable,
  TemplateRef,
  booleanAttribute,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { AvatarComponent } from '../avatar/avatar.component';
import { BadgeComponent } from '../badge/badge.component';
import { CsButtonDirective } from '../core/foundations/cs-button.directive';
import { ProgressBarComponent } from '../progress-bar/progress-bar.component';
import { ProgressRingComponent } from '../progress-ring/progress-ring.component';
import { SkeletonComponent } from '../skeleton/skeleton.component';
import { CsDataState } from '../core/platform/cs-data-state.type';
import { CsDataStateError } from '../core/platform/cs-data-state-error.interface';
import { CsFormatService } from '../core/platform/cs-format.service';
import { CsMessageTone } from '../core/platform/cs-message-tone.type';
import { Subject } from 'rxjs';
import { SortChange } from './sort-change.interface';

@Directive({
  selector: 'th[csTableSortHeader]',
  host: { tabindex: '0', role: 'button', '(click)': 'sort()' },
})
export class TableSortHeaderDirective {
  readonly id = input.required<string>({ alias: 'csTableSortHeader' });
  readonly direction = input<'asc' | 'desc' | ''>('');
  readonly sortChange = output<SortChange>();
  protected sort(): void {
    this.sortChange.emit({
      active: this.id(),
      direction: this.direction() === 'asc' ? 'desc' : 'asc',
    });
  }
}
