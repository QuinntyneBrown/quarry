import { ClipboardModule } from '@angular/cdk/clipboard';
import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  Pipe,
  PipeTransform,
  booleanAttribute,
  computed,
  input,
  model,
  output,
  signal,
} from '@angular/core';
import { AvatarComponent } from '../avatar/avatar.component';
import { BadgeComponent } from '../badge/badge.component';
import { CsButtonDirective } from '../core/foundations/cs-button.directive';
import { CardComponent } from '../card/card.component';
import { ProgressBarComponent } from '../progress-bar/progress-bar.component';
import { ChoiceGroupComponent } from '../choice-group/choice-group.component';
import { DateTimeFieldComponent } from '../date-time-field/date-time-field.component';
import { FieldComponent } from '../field/field.component';
import { CsInputDirective } from '../core/forms/cs-input.directive';
import { SearchFieldComponent } from '../search-field/search-field.component';
import { CsTextareaDirective } from '../core/forms/cs-textarea.directive';
import { CsDataState } from '../core/platform/cs-data-state.type';
import { csSafeUrl } from '../core/platform/cs-safe-url.function';
import { NotificationItemComponent } from '../notification-item/notification-item.component';
import { CsNotificationNavigateIntent } from '../core/communication/cs-notification-navigate-intent.interface';
import { CsNotificationViewModel } from '../core/communication/cs-notification-view-model.interface';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'cs-notification-list',
  imports: [NotificationItemComponent, CsButtonDirective],
  templateUrl: './notification-list.component.html',
  styleUrl: './notification-list.component.scss',
})
export class NotificationListComponent {
  readonly notifications = input.required<readonly CsNotificationViewModel[]>();
  readonly state = input<CsDataState>({ status: 'ready', data: undefined });
  readonly unreadCount = input(0);
  readonly markRead = output<string>();
  readonly markAllRead = output<void>();
  readonly navigate = output<CsNotificationNavigateIntent>();
}
