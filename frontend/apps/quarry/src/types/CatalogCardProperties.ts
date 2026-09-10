import type { FrameworkSummary } from "./FrameworkSummary";

export type CatalogCardProperties = {
  framework: FrameworkSummary;
  onExplore: (id: string) => void;
};
