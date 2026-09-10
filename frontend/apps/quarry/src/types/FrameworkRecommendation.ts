import type { FrameworkSummary } from "./FrameworkSummary";

export type FrameworkRecommendation = FrameworkSummary & {
  rank: number;
  explanation: string;
  supportingCapabilityIds: string[];
};
