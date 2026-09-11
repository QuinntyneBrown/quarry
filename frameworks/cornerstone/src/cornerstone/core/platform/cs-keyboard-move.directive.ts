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

@Directive({
  selector: '[csKeyboardMove]',
  host: { tabindex: '0', '(keydown)': 'keydown($event)' },
})
export class CsKeyboardMoveDirective {
  readonly itemId = input.required<string>({ alias: 'csKeyboardMove' });
  readonly moved = output<'lift' | 'previous' | 'next' | 'first' | 'last' | 'drop' | 'cancel'>();
  protected keydown(event: KeyboardEvent): void {
    const action: Record<
      string,
      'lift' | 'previous' | 'next' | 'first' | 'last' | 'drop' | 'cancel'
    > = {
      Space: 'lift',
      ArrowUp: 'previous',
      ArrowLeft: 'previous',
      ArrowDown: 'next',
      ArrowRight: 'next',
      Home: 'first',
      End: 'last',
      Escape: 'cancel',
      Enter: 'drop',
    };
    const value = action[event.code] ?? action[event.key];
    if (value) {
      event.preventDefault();
      this.moved.emit(value);
    }
  }
}
