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
import { FilePickerComponent } from '../file-picker/file-picker.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'cs-dropzone',
  imports: [FilePickerComponent],
  templateUrl: './dropzone.component.html',
  host: { class: 'cs-dropzone' },
  styleUrl: './dropzone.component.scss',
})
export class DropzoneComponent {
  readonly multiple = input(false);
  readonly accept = input('');
  readonly filesSelected = output<readonly File[]>();
  protected drop(e: DragEvent): void {
    e.preventDefault();
    this.filesSelected.emit(Array.from(e.dataTransfer?.files ?? []));
  }
}
