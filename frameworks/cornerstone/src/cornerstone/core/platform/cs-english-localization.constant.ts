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
import { CsLocalization } from './cs-localization.interface';

export const CS_ENGLISH_LOCALIZATION: CsLocalization = {
  confirm: 'Confirm',
  cancel: 'Cancel',
  close: 'Close',
  clear: 'Clear',
  loading: 'Loading',
  empty: 'No results',
  retry: 'Try again',
  previous: 'Previous',
  next: 'Next',
  page: 'Page',
  search: 'Search',
  chooseFiles: 'Choose files',
  remove: 'Remove',
  menu: 'Menu',
  openExternal: 'opens in a new tab',
};
