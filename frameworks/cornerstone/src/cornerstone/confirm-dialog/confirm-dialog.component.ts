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
import { ConfirmDialogData } from './confirm-dialog-data.interface';
import { ConfirmResult } from './confirm-result.type';
import { DialogActionsDirective } from '../dialog-shell/dialog-actions.directive';
import { DialogDescriptionDirective } from '../dialog-shell/dialog-description.directive';
import { DialogShellComponent } from '../dialog-shell/dialog-shell.component';
import { DialogTitleDirective } from '../dialog-shell/dialog-title.directive';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'cs-confirm-dialog',
  imports: [
    DialogShellComponent,
    DialogTitleDirective,
    DialogDescriptionDirective,
    DialogActionsDirective,
    CsButtonDirective,
  ],
  templateUrl: './confirm-dialog.component.html',
  styleUrl: './confirm-dialog.component.scss',
})
export class ConfirmDialogComponent {
  protected readonly strings = inject(CsLocalizationService);
  readonly data = input.required<ConfirmDialogData>();
  readonly resolved = output<ConfirmResult>();
}
