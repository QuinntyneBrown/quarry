import { Directive, ViewContainerRef, inject } from '@angular/core';

@Directive({ selector: '[csDocsPreviewHost]' })
export class PreviewHostDirective {
  readonly viewContainer = inject(ViewContainerRef);
}
