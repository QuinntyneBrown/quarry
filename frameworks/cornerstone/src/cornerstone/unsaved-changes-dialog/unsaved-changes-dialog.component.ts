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
import { DialogActionsDirective } from '../dialog-shell/dialog-actions.directive';
import { DialogShellComponent } from '../dialog-shell/dialog-shell.component';
import { DialogTitleDirective } from '../dialog-shell/dialog-title.directive';
import { UnsavedChangesChoice } from './unsaved-changes-choice.type';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'cs-unsaved-changes-dialog',
  imports: [DialogShellComponent, CsButtonDirective, DialogTitleDirective, DialogActionsDirective],
  templateUrl: './unsaved-changes-dialog.component.html',
  styleUrl: './unsaved-changes-dialog.component.scss',
})
export class UnsavedChangesDialogComponent {
  readonly title = input('Unsaved changes');
  readonly choice = output<UnsavedChangesChoice>();
}
