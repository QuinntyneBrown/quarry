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

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'cs-dialog-shell',
  imports: [CdkTrapFocus],
  templateUrl: './dialog-shell.component.html',
  host: { class: 'cs-dialog-shell' },
  styleUrl: './dialog-shell.component.scss',
})
export class DialogShellComponent {}
