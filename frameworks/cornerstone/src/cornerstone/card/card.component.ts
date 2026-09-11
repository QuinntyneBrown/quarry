import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  ElementRef,
  EnvironmentProviders,
  InjectionToken,
  Injectable,
  booleanAttribute,
  computed,
  inject,
  input,
  makeEnvironmentProviders,
  output,
} from '@angular/core';
import { CsIdService } from '../core/platform/cs-id.service';
import { CsMessageTone } from '../core/platform/cs-message-tone.type';
import { CardPresentation } from './card-presentation.type';
import { CardTone } from './card-tone.type';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'cs-card',
  templateUrl: './card.component.html',
  styleUrl: './card.component.scss',
  host: {
    '[class]': "'cs-card cs-card--' + tone() + ' cs-card--' + presentation()",
    '[class.cs-card--interactive]': 'interactive()',
    '[attr.tabindex]': 'interactive() ? 0 : null',
    '(click)': 'activate()',
  },
})
export class CardComponent {
  readonly tone = input<CardTone>('paper');
  readonly presentation = input<CardPresentation>('outlined');
  readonly interactive = input(false, { transform: booleanAttribute });
  readonly activated = output<void>();
  protected activate(): void {
    if (this.interactive()) this.activated.emit();
  }
}
