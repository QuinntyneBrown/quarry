import type { FrameworkSummary } from "./FrameworkSummary";
import type { FrameworkRecommendation } from "./FrameworkRecommendation";

export type CatalogCardProperties = {
  framework: FrameworkSummary;
  recommendation?: FrameworkRecommendation;
  isSelected: boolean;
  onExplore: (id: string, opener: HTMLButtonElement) => void;
};
