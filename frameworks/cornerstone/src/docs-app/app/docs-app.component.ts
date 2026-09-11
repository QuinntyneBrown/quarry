import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CsThemeService } from '@quinntyne/cornerstone';
import { CatalogData } from './catalog-data.class';

@Component({
  selector: 'cs-docs-app',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './docs-app.component.html',
  styleUrl: './docs-app.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocsAppComponent {
  protected readonly theme = inject(CsThemeService);
  protected readonly query = signal('');
  protected readonly visibleCategories = computed(() => {
    const query = this.query().trim().toLowerCase();
    if (!query) return CatalogData.componentCategories;
    return CatalogData.componentCategories
      .map((category) => ({
        ...category,
        components: category.components.filter((component) =>
          `${component.label} ${component.selector} ${component.name}`
            .toLowerCase()
            .includes(query),
        ),
      }))
      .filter((category) => category.components.length);
  });

  protected toggleTheme(): void {
    this.theme.set(this.theme.resolved() === 'dark' ? 'light' : 'dark');
  }
}
