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
import { CsIdService } from '../platform/cs-id.service';
import { CsMessageTone } from '../platform/cs-message-tone.type';
import { CsGridColumns } from './cs-grid-columns.type';
import { CsSpacingStep } from './cs-spacing-step.type';

@Directive({
  selector: '[csGrid]',
  host: {
    class: 'cs-grid',
    '[style.--cs-gap]': "'var(--cs-space-' + gap() + ')'",
    '[style.--cs-columns]': 'resolvedColumns()',
  },
})
export class CsGridDirective {
  readonly gap = input<CsSpacingStep>(4);
  readonly columns = input<CsGridColumns>('auto');
  readonly resolvedColumns = computed(() =>
    this.columns() === 'auto' ? 'auto-fit' : `${this.columns()}`,
  );
}
