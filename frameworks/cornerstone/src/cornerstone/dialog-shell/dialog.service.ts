import { CdkTrapFocus } from '@angular/cdk/a11y';
import { Dialog } from '@angular/cdk/dialog';
import { ComponentPortal, ComponentType } from '@angular/cdk/portal';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  Injectable,
  booleanAttribute,
  inject,
  input,
  model,
  output,
} from '@angular/core';
import { CsButtonDirective } from '../core/foundations/cs-button.directive';
import { CsBreakpointService } from '../core/platform/cs-breakpoint.service';
import { CsLocalizationService } from '../core/platform/cs-localization.service';
import { DialogConfig } from './dialog-config.type';
import { DialogRef } from './dialog-ref.type';

@Injectable({ providedIn: 'root' })
export class DialogService {
  private readonly dialog = inject(Dialog);
  private readonly breakpoints = inject(CsBreakpointService);
  open<R, D, C>(component: ComponentType<C>, config: DialogConfig<D, R, C> = {}): DialogRef<R, C> {
    const { size = 'medium', fullScreenOnMobile = false, ...dialogConfig } = config;
    const fullScreen = fullScreenOnMobile && this.breakpoints.compact();
    return this.dialog.open<R, D, C>(component, {
      ...dialogConfig,
      panelClass: ['cs-dialog-panel', `cs-dialog--${fullScreen ? 'full' : size}`],
    });
  }
}
