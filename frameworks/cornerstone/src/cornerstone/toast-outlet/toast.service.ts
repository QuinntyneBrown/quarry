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
import { ToastConfig } from './toast-config.interface';
import { ToastRef } from './toast-ref.class';

@Injectable({ providedIn: 'root' })
export class ToastService {
  private sequence = 0;
  readonly items = signal<readonly ToastRef[]>([]);
  open(config: ToastConfig): ToastRef {
    const ref = new ToastRef(++this.sequence, config);
    this.items.update((items) => [...items, ref].slice(-3));
    const duration = config.duration ?? (config.actionLabel ? 10000 : 5000);
    setTimeout(() => this.dismiss(ref.id), duration);
    return ref;
  }
  dismiss(id: number): void {
    this.items.update((items) => items.filter((item) => item.id !== id));
  }
}
