import { Directive, ViewContainerRef, inject } from '@angular/core';

@Directive({ selector: '[csFixtureHost]' })
export class FixtureHostDirective {
  readonly viewContainer = inject(ViewContainerRef);
}
