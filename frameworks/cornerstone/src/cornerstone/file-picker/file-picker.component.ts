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
import { FileRejection } from './file-rejection.interface';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'cs-file-picker',
  templateUrl: './file-picker.component.html',
  styleUrl: './file-picker.component.scss',
  host: { class: 'cs-file-picker' },
})
export class FilePickerComponent {
  readonly multiple = input(false);
  readonly accept = input('');
  readonly maxBytes = input(Number.MAX_SAFE_INTEGER);
  readonly filesSelected = output<readonly File[]>();
  readonly rejected = output<readonly FileRejection[]>();
  protected picked(e: Event): void {
    const files = Array.from((e.target as HTMLInputElement).files ?? []);
    const rejected = files
      .filter((f) => f.size > this.maxBytes())
      .map((file) => ({ file, reason: 'size' as const }));
    if (rejected.length) this.rejected.emit(rejected);
    this.filesSelected.emit(files.filter((f) => f.size <= this.maxBytes()));
  }
}
