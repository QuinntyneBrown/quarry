import type { FrameworkSummary } from "./FrameworkSummary";

export type FrameworkSearchResponse = {
  items: FrameworkSummary[];
  catalogRevision: string;
  isIndexIncomplete: boolean;
};
