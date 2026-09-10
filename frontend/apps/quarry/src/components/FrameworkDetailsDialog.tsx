import { useEffect, useRef } from "react";
import type { FrameworkDetailsDialogProperties } from "../types/FrameworkDetailsDialogProperties";

export function FrameworkDetailsDialog({ details, onClose, onSelect }: FrameworkDetailsDialogProperties): React.JSX.Element {
  const closeButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeButton.current?.focus();
    function dismissWithEscape(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", dismissWithEscape);
    return () => window.removeEventListener("keydown", dismissWithEscape);
  }, [onClose]);

  return <dialog open aria-label={`${details.summary.name} details`}><h2>{details.summary.name}</h2><p>{details.summary.description}</p><p>{details.summary.technology} · {details.summary.componentCount} components</p><button type="button" onClick={onSelect}>Select framework</button><button ref={closeButton} type="button" onClick={onClose}>Close details</button></dialog>;
}
