import {
  ChangeDetectionStrategy,
  Component,
  effect,
  input,
  signal,
  viewChild,
} from '@angular/core';
import components from '../generated/components.json';
import { componentRegistry } from '../generated/component-registry.constant';
import { FixtureHostDirective } from './fixture-host.directive';
import { fixtureValues } from './fixture-values.constant';
import { initialFixtureValue } from './initial-fixture-value.function';

@Component({
  selector: 'cs-component-fixture',
  imports: [FixtureHostDirective],
  templateUrl: './component-fixture.component.html',
  styleUrl: './component-fixture.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ComponentFixtureComponent {
  readonly slug = input.required<string>();
  protected readonly label = signal('Loading fixture');
  protected readonly ready = signal(false);
  protected readonly error = signal('');
  private readonly host = viewChild(FixtureHostDirective);

  constructor() {
    effect((onCleanup) => {
      const slug = this.slug();
      const host = this.host();
      let active = true;
      onCleanup(() => {
        active = false;
      });
      this.ready.set(false);
      this.error.set('');
      if (!host) return;
      host.viewContainer.clear();
      const entry = components.find((component) => component.slug === slug);
      const loader = componentRegistry[slug];
      if (!entry || !loader) {
        this.label.set('Unknown component');
        this.error.set(`No fixture exists for ${slug}.`);
        return;
      }
      this.label.set(entry.label);
      void loader()
        .then((type) => {
          if (!active) return;
          const projected = document.createTextNode(`${entry.label} fixture content`);
          const instance = host.viewContainer.createComponent(type, {
            projectableNodes: [[projected]],
          });
          for (const member of entry.members.filter(
            (member) => member.role === 'input' || member.role === 'model',
          )) {
            const fixture = fixtureValues[slug]?.[member.name];
            instance.setInput(
              member.bindingName ?? member.name,
              fixture ?? initialFixtureValue(member),
            );
          }
          instance.changeDetectorRef.detectChanges();
          this.ready.set(true);
        })
        .catch((error: unknown) => {
          if (active) this.error.set(error instanceof Error ? error.message : String(error));
        });
    });
  }
}
