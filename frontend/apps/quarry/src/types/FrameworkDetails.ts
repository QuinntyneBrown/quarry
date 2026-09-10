import type { FrameworkSummary } from "./FrameworkSummary";
import type { FrameworkCapability } from "./FrameworkCapability";
import type { FrameworkComponentDescriptor } from "./FrameworkComponentDescriptor";
import type { PreviewManifest } from "./PreviewManifest";

export type FrameworkDetails = {
  summary: FrameworkSummary;
  capabilities: FrameworkCapability[];
  useCases: string[];
  components: FrameworkComponentDescriptor[];
  previewManifest?: PreviewManifest | null;
};
