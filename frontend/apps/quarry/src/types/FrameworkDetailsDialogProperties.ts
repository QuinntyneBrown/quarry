import type { FrameworkDetails } from "./FrameworkDetails";

export type FrameworkDetailsDialogProperties = {
  details?: FrameworkDetails;
  error?: string;
  isLoading: boolean;
  onClose: () => void;
  onRetry: () => void;
  onSelect: () => void;
};
