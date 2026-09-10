import type { FrameworkSummary } from "./FrameworkSummary";

export type CatalogPage = {
  items: FrameworkSummary[];
  total: number;
  hasNextPage: boolean;
  nextCursor: string | null;
  catalogRevision: string;
};
