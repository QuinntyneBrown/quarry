import type { FrameworkDetailsDialogProperties } from "../types/FrameworkDetailsDialogProperties";

export function FrameworkDetailsDialog({ details, onClose }: FrameworkDetailsDialogProperties): React.JSX.Element {
  return <dialog open aria-label={`${details.summary.name} details`}><h2>{details.summary.name}</h2><p>{details.summary.description}</p><p>{details.summary.technology} · {details.summary.componentCount} components</p><button type="button" onClick={onClose}>Close details</button></dialog>;
}
