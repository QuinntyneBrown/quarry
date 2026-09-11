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
import { CsThemeName } from './cs-theme-name.type';
import { CsThemePreference } from './cs-theme-preference.type';
import { csIsBrowser } from './cs-is-browser.function';

@Injectable({ providedIn: 'root' })
export class CsThemeService {
  private readonly document = inject(DOCUMENT);
  readonly preference = signal<CsThemePreference>('system');
  readonly resolved = signal<CsThemeName>(inject(CS_SERVER_DEFAULTS).theme);
  set(preference: CsThemePreference): void {
    this.preference.set(preference);
    const dark =
      preference === 'dark' ||
      (preference === 'system' &&
        csIsBrowser() &&
        matchMedia('(prefers-color-scheme: dark)').matches);
    this.resolved.set(dark ? 'dark' : 'light');
    this.document.documentElement.classList.toggle('cs-theme-dark', dark);
    this.document.documentElement.classList.toggle('cs-theme-light', !dark);
  }
}
