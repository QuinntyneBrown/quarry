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
import { CsOverlayPosition } from './cs-overlay-position.type';

export const CsOverlayPositions: Readonly<
  Record<Exclude<CsOverlayPosition, 'centred'>, readonly ConnectedPosition[]>
> = {
  belowStart: [
    { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top' },
    { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom' },
  ],
  belowEnd: [
    { originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top' },
    { originX: 'end', originY: 'top', overlayX: 'end', overlayY: 'bottom' },
  ],
  aboveStart: [
    { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom' },
    { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top' },
  ],
  aboveEnd: [
    { originX: 'end', originY: 'top', overlayX: 'end', overlayY: 'bottom' },
    { originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top' },
  ],
  inlineStart: [
    { originX: 'start', originY: 'center', overlayX: 'end', overlayY: 'center' },
    { originX: 'end', originY: 'center', overlayX: 'start', overlayY: 'center' },
  ],
  inlineEnd: [
    { originX: 'end', originY: 'center', overlayX: 'start', overlayY: 'center' },
    { originX: 'start', originY: 'center', overlayX: 'end', overlayY: 'center' },
  ],
};
