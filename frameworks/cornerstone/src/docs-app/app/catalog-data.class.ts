import catalogJson from '../generated/catalog.json';
import { ApiEntry } from './api-entry.interface';

export class CatalogData {
  static readonly catalog = catalogJson as unknown as {
    readonly symbolCount: number;
    readonly components: readonly ApiEntry[];
  };
  static readonly categoryLabels: Readonly<Record<string, string>> = {
    communication: 'Communication',
    'data-display': 'Data display',
    forms: 'Forms',
    foundations: 'Foundations',
    marketing: 'Marketing',
    navigation: 'Navigation',
    overlays: 'Overlays',
    platform: 'Platform',
    process: 'Process',
    workflows: 'Workflows',
  };
  static readonly componentCategories = Object.entries(
    CatalogData.catalog.components.reduce<Record<string, ApiEntry[]>>((groups, component) => {
      (groups[component.category] ??= []).push(component);
      return groups;
    }, {}),
  )
    .map(([key, components]) => ({
      key,
      label: CatalogData.categoryLabels[key] ?? CatalogData.titleCase(key),
      components: components.sort((a, b) => (a.label ?? a.name).localeCompare(b.label ?? b.name)),
    }))
    .sort((a, b) => a.label.localeCompare(b.label));

  static titleCase(value: string): string {
    return value.replaceAll('-', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  static componentDescription(component: ApiEntry): string {
    const label = component.label ?? component.name;
    return `${label} is the public ${component.selector} component from @quinntyne/cornerstone. Explore its live behavior, change its inputs, inspect emitted events, and copy a complete working example.`;
  }
}
