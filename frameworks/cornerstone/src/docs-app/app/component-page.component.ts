import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { ApiEntry } from './api-entry.interface';
import { CatalogData } from './catalog-data.class';
import { LivePlaygroundComponent } from './live-playground.component';

@Component({
  selector: 'cs-docs-component-page',
  imports: [RouterLink, LivePlaygroundComponent],
  templateUrl: './component-page.component.html',
  styleUrl: './component-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ComponentPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly routeState = toSignal(
    this.route.paramMap.pipe(
      map((params) => ({ slug: params.get('slug'), section: params.get('section') ?? 'overview' })),
    ),
    { initialValue: { slug: '', section: 'overview' } },
  );
  protected readonly component = signal<ApiEntry | undefined>(undefined);
  protected readonly section = () => this.routeState().section;
  protected readonly tabs = ['overview', 'api', 'styling', 'examples'] as const;
  protected readonly description = CatalogData.componentDescription;
  protected readonly categoryLabel = CatalogData.titleCase;

  constructor() {
    effect(() => {
      const slug = this.routeState().slug;
      this.component.set(undefined);
      if (!slug) return;
      fetch(`/generated/components/${slug}.json`)
        .then((response) => (response.ok ? response.json() : undefined))
        .then((entry: ApiEntry | undefined) => {
          if (this.routeState().slug === slug) this.component.set(entry);
        });
    });
  }

  protected memberGroups(
    component: ApiEntry,
  ): readonly { role: string; label: string; members: NonNullable<ApiEntry['members']> }[] {
    const groups = [
      { role: 'input', label: 'Inputs and models', roles: ['input', 'model'] },
      { role: 'output', label: 'Outputs', roles: ['output'] },
      { role: 'property', label: 'Properties', roles: ['property'] },
      { role: 'method', label: 'Methods', roles: ['method'] },
    ];
    return groups
      .map((group) => ({
        ...group,
        members: (component.members ?? []).filter((member) => group.roles.includes(member.role)),
      }))
      .filter((group) => group.members.length);
  }

  protected signature(member: NonNullable<ApiEntry['members']>[number]): string {
    if (member.role !== 'method') return `${member.name}: ${member.type}`;
    const parameters = (member.parameters ?? [])
      .map((parameter) => `${parameter.name}${parameter.optional ? '?' : ''}: ${parameter.type}`)
      .join(', ');
    return `${member.name}(${parameters}): ${member.type}`;
  }

  protected related(component: ApiEntry): readonly ApiEntry[] {
    return component.relatedEntries ?? [];
  }

  protected tokens(component: ApiEntry): readonly string[] {
    return component.tokens ?? [];
  }

  protected sourceUrl(component: ApiEntry): string {
    return `https://github.com/QuinntyneBrown/Cornerstone/blob/main/${component.sourcePath}`;
  }

  protected async copyImport(component: ApiEntry): Promise<void> {
    await navigator.clipboard.writeText(
      `import { ${component.name} } from '@quinntyne/cornerstone';`,
    );
  }
}
