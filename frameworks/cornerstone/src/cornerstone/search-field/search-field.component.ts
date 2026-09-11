import { CdkTextareaAutosize } from '@angular/cdk/text-field';
import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  ElementRef,
  Provider,
  booleanAttribute,
  computed,
  forwardRef,
  inject,
  input,
  model,
  output,
  signal,
} from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { CsButtonDirective } from '../core/foundations/cs-button.directive';
import { CsControlBase } from '../core/platform/cs-control-base.class';
import { CsIdService } from '../core/platform/cs-id.service';
import { CsLocalizationService } from '../core/platform/cs-localization.service';
import { SearchMode } from './search-mode.type';
import { valueAccessor } from '../core/forms/value-accessor.function';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'cs-search-field',
  providers: [valueAccessor(() => SearchFieldComponent)],
  imports: [CsButtonDirective],
  templateUrl: './search-field.component.html',
  styleUrl: './search-field.component.scss',
})
export class SearchFieldComponent extends CsControlBase<string> {
  protected readonly strings = inject(CsLocalizationService);
  readonly mode = input<SearchMode>('instant');
  readonly placeholder = input('Search');
  readonly searched = output<string>();
  protected change(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.updateValue(value);
    if (this.mode() === 'instant') this.searched.emit(value);
  }
  protected clear(): void {
    this.updateValue('');
    this.searched.emit('');
  }
  protected submit(event: Event): void {
    event.preventDefault();
    this.searched.emit(this.value() ?? '');
  }
}
