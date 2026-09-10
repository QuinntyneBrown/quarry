import type { FrameworkDetails } from "./FrameworkDetails";

export type FrameworkDetailsDialogProperties = {
  details: FrameworkDetails;
  onClose: () => void;
  onSelect: () => void;
};
