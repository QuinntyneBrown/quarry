import type { PreviewManifest } from "./PreviewManifest";

export type ComponentPreviewPanelProperties = {
  frameworkName: string;
  manifest: PreviewManifest;
  onDismiss: () => void;
  onFocusExit: (direction: "forward" | "backward") => void;
};
