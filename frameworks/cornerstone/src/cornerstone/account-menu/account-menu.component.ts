import { CdkMenu, CdkMenuItem } from '@angular/cdk/menu';
import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  TemplateRef,
  booleanAttribute,
  computed,
  contentChildren,
  inject,
  input,
  model,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { AvatarComponent } from '../avatar/avatar.component';
import { BadgeComponent } from '../badge/badge.component';
import { CsButtonDirective } from '../core/foundations/cs-button.directive';
import { IconComponent } from '../icon/icon.component';
import { CsBreakpointService } from '../core/platform/cs-breakpoint.service';
import { Account } from './account.interface';
import { AccountAction } from './account-action.interface';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'cs-account-menu',
  imports: [AvatarComponent],
  templateUrl: './account-menu.component.html',
  styleUrl: './account-menu.component.scss',
})
export class AccountMenuComponent {
  readonly account = input.required<Account>();
  readonly actions = input.required<readonly AccountAction[]>();
  readonly open = signal(false);
  readonly actionSelected = output<AccountAction>();
  readonly signOut = output<void>();
  protected select(action: AccountAction): void {
    this.open.set(false);
    if (action.id === 'sign-out') this.signOut.emit();
    else this.actionSelected.emit(action);
  }
}
