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
import { CS_SERVER_DEFAULTS } from './cs-server-defaults.token';
import { CsBreakpoints } from './cs-breakpoints.constant';
import { CsViewportClass } from './cs-viewport-class.type';
import { csIsBrowser } from './cs-is-browser.function';

@Injectable({ providedIn: 'root' })
export class CsBreakpointService {
  private readonly observer = inject(BreakpointObserver);
  private readonly defaults = inject(CS_SERVER_DEFAULTS);
  readonly viewport = signal<CsViewportClass>(this.defaults.viewport);
  constructor() {
    if (csIsBrowser()) {
      this.observer.observe(Object.values(CsBreakpoints)).subscribe((state) => {
        const entry = (Object.entries(CsBreakpoints) as [CsViewportClass, string][]).find(
          ([, query]) => state.breakpoints[query],
        );
        if (entry) this.viewport.set(entry[0]);
      });
    }
  }
  readonly compact = computed(() => ['xs', 'sm'].includes(this.viewport()));
}
