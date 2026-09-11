import { CdkTrapFocus } from '@angular/cdk/a11y';
import { Dialog, DialogConfig, DialogRef } from '@angular/cdk/dialog';
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
import { DrawerConfig } from './drawer-config.interface';
import { DrawerRef } from './drawer-ref.class';

@Injectable({ providedIn: 'root' })
export class DrawerService {
  private readonly overlay = inject(Overlay);
  open<R, D, C>(component: ComponentType<C>, config: DrawerConfig<D> = {}): DrawerRef<R, C> {
    const ref = this.overlay.create({
      hasBackdrop: config.mode !== 'non-modal',
      positionStrategy: this.overlay.position().global().right('0').top('0'),
      scrollStrategy: this.overlay.scrollStrategies.block(),
    });
    const instance = ref.attach(new ComponentPortal(component)).instance;
    return new DrawerRef<R, C>(ref, instance);
  }
}
