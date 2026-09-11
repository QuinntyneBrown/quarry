import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiEntry } from './api-entry.interface';
import { CatalogData } from './catalog-data.class';

@Component({
  selector: 'cs-docs-catalog-page',
  imports: [RouterLink],
  templateUrl: './catalog-page.component.html',
  styleUrl: './catalog-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CatalogPageComponent {
  protected readonly categories = CatalogData.componentCategories;
  protected readonly componentCount = CatalogData.catalog.components.length;
  protected readonly symbolCount = CatalogData.catalog.symbolCount;
  protected readonly categoryCount = CatalogData.componentCategories.length;
  protected readonly description = (component: ApiEntry) =>
    CatalogData.componentDescription(component);
}
