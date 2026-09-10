import type { FrameworkSummary } from "./FrameworkSummary";
import type { FrameworkRecommendation } from "./FrameworkRecommendation";

export type CatalogCardProperties = {
  framework: FrameworkSummary;
  recommendation?: FrameworkRecommendation;
  onExplore: (id: string, opener: HTMLButtonElement) => void;
};
