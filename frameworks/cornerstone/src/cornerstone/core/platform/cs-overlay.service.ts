import { Directionality } from '@angular/cdk/bidi';
import { CdkTrapFocus, FocusMonitor, LiveAnnouncer } from '@angular/cdk/a11y';
import { CdkDrag, CdkDropList } from '@angular/cdk/drag-drop';
import { BreakpointObserver } from '@angular/cdk/layout';
import {
  ConnectedPosition,
  FlexibleConnectedPositionStrategyOrigin,
  Overlay,
  OverlayRef,
} from '@angular/cdk/overlay';
import { CdkTextareaAutosize } from '@angular/cdk/text-field';
import {
  DOCUMENT,
  formatCurrency,
  formatDate,
  formatNumber,
  isPlatformBrowser,
} from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  ElementRef,
  EnvironmentProviders,
  InjectionToken,
  Injectable,
  LOCALE_ID,
  PLATFORM_ID,
  Provider,
  Pipe,
  PipeTransform,
  Signal,
  afterNextRender,
  computed,
  inject,
  makeEnvironmentProviders,
  model,
  signal,
  input,
  output,
  provideEnvironmentInitializer,
} from '@angular/core';
import { ControlValueAccessor } from '@angular/forms';
import { Observable, Subject } from 'rxjs';
import { CsOverlayConfig } from './cs-overlay-config.interface';
import { CsOverlayPositions } from './cs-overlay-positions.constant';
import { CsOverlayRef } from './cs-overlay-ref.class';

@Injectable({ providedIn: 'root' })
export class CsOverlayService {
  private readonly overlay = inject(Overlay);
  create<R = unknown>(config: CsOverlayConfig): CsOverlayRef<R> {
    const position =
      config.position === 'centred' || !config.origin
        ? this.overlay.position().global().centerHorizontally().centerVertically()
        : this.overlay
            .position()
            .flexibleConnectedTo(config.origin)
            .withPositions([...CsOverlayPositions[config.position ?? 'belowStart']]);
    const scroll =
      config.scrollStrategy === 'block'
        ? this.overlay.scrollStrategies.block()
        : config.scrollStrategy === 'close'
          ? this.overlay.scrollStrategies.close()
          : this.overlay.scrollStrategies.reposition();
    return new CsOverlayRef<R>(
      this.overlay.create({
        positionStrategy: position,
        scrollStrategy: scroll,
        hasBackdrop: config.hasBackdrop,
        panelClass: config.panelClass,
        direction: config.direction,
      }),
    );
  }
}
