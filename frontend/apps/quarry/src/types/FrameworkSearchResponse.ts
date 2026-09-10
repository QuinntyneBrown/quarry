import type { FrameworkRecommendation } from "./FrameworkRecommendation";

export type FrameworkSearchResponse = {
  items: FrameworkRecommendation[];
  catalogRevision: string;
  isIndexIncomplete: boolean;
};
