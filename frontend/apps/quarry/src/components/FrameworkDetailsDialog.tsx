import { useEffect, useRef, useState } from "react";
import type { FrameworkDetailsDialogProperties } from "../types/FrameworkDetailsDialogProperties";
import type { FrameworkDetailsTab } from "../types/FrameworkDetailsTab";

export function FrameworkDetailsDialog({ details, onClose, onSelect }: FrameworkDetailsDialogProperties): React.JSX.Element {
  const dialog = useRef<HTMLDialogElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const overviewTab = useRef<HTMLButtonElement>(null);
  const componentsTab = useRef<HTMLButtonElement>(null);
  const [activeTab, setActiveTab] = useState<FrameworkDetailsTab>("overview");

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

  function selectTab(tab: FrameworkDetailsTab): void {
    setActiveTab(tab);
    if (tab === "overview") {
      overviewTab.current?.focus();
      return;
    }
    componentsTab.current?.focus();
  }

  function moveTab(event: React.KeyboardEvent<HTMLButtonElement>): void {
    if (event.key === "ArrowRight" || event.key === "End") {
      event.preventDefault();
      selectTab("components");
    }
    if (event.key === "ArrowLeft" || event.key === "Home") {
      event.preventDefault();
      selectTab("overview");
    }
  }

  function trapFocus(event: React.KeyboardEvent<HTMLDialogElement>): void {
    if (event.key !== "Tab") {
      return;
    }
    const focusable = Array.from(dialog.current?.querySelectorAll<HTMLButtonElement>("button:not([disabled]):not([tabindex='-1'])") ?? []);
    const currentIndex = focusable.indexOf(document.activeElement as HTMLButtonElement);
    if (currentIndex === -1) {
      return;
    }
    const nextIndex = event.shiftKey
      ? (currentIndex - 1 + focusable.length) % focusable.length
      : (currentIndex + 1) % focusable.length;
    event.preventDefault();
    focusable[nextIndex]?.focus();
  }

  return <dialog ref={dialog} open aria-label={`${details.summary.name} details`} onKeyDown={trapFocus}><h2>{details.summary.name}</h2><div role="tablist" aria-label="Framework details"><button ref={overviewTab} type="button" role="tab" id="overview-tab" aria-controls="overview-panel" aria-selected={activeTab === "overview"} tabIndex={activeTab === "overview" ? 0 : -1} onClick={() => selectTab("overview")} onKeyDown={moveTab}>Overview</button><button ref={componentsTab} type="button" role="tab" id="components-tab" aria-controls="components-panel" aria-selected={activeTab === "components"} tabIndex={activeTab === "components" ? 0 : -1} onClick={() => selectTab("components")} onKeyDown={moveTab}>Components</button></div>{activeTab === "overview" ? <section role="tabpanel" id="overview-panel" aria-labelledby="overview-tab"><p>{details.summary.description}</p><p>{details.summary.technology} · {details.summary.componentCount} components</p><h3>Capabilities</h3><ul>{(details.capabilities ?? []).map((capability) => <li key={capability.id}>{capability.description}</li>)}</ul><h3>Suitable use cases</h3><ul>{(details.useCases ?? []).map((useCase) => <li key={useCase}>{useCase}</li>)}</ul><p>Framework appearance is customized during implementation through its own themes and design tokens.</p></section> : <section role="tabpanel" id="components-panel" aria-labelledby="components-tab">{(details.components ?? []).length === 0 ? <p>Component previews are unavailable for this framework revision.</p> : <ul>{details.components.map((component) => <li key={component.id}><strong>{component.name}</strong><p>{component.description}</p></li>)}</ul>}</section>}<button type="button" onClick={onSelect}>Select framework</button><button ref={closeButton} type="button" onClick={onClose}>Close details</button></dialog>;
}
