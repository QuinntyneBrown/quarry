import type { FrameworkDetails } from "./FrameworkDetails";

export type FrameworkDetailsDialogProperties = {
  details?: FrameworkDetails;
  error?: string;
  retryAt?: number;
  isLoading: boolean;
  isSelected: boolean;
  isUnavailable: boolean;
  isUpdated: boolean;
  explanation?: string;
  onClose: () => void;
  onRetry: () => void;
  onSelect: () => void;
};
