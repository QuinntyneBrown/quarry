import { CdkTrapFocus } from '@angular/cdk/a11y';
import {
  Dialog,
  DialogConfig as CdkDialogConfig,
  DialogRef as CdkDialogRef,
} from '@angular/cdk/dialog';
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
import { DialogSize } from './dialog-size.type';

export type DialogConfig<D = unknown, R = unknown, C = unknown> = CdkDialogConfig<
  D,
  CdkDialogRef<R, C>
> & { readonly size?: DialogSize; readonly fullScreenOnMobile?: boolean };
