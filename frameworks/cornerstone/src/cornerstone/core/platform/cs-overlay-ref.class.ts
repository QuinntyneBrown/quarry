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

export class CsOverlayRef<R = unknown> {
  private readonly result = new Subject<R | undefined>();
  readonly closed: Observable<R | undefined> = this.result.asObservable();
  constructor(readonly overlayRef: OverlayRef) {}
  close(value?: R): void {
    this.result.next(value);
    this.result.complete();
    this.overlayRef.dispose();
  }
}
