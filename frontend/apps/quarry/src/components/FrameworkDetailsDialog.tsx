import { useEffect, useRef, useState } from "react";
import type { FrameworkDetailsDialogProperties } from "../types/FrameworkDetailsDialogProperties";
import type { FrameworkDetailsTab } from "../types/FrameworkDetailsTab";
import { RetryButton } from "./RetryButton";
import { ComponentPreviewPanel } from "./ComponentPreviewPanel";
import { getPreviewManifest } from "../previews/getPreviewManifest";

export function FrameworkDetailsDialog({ details, error, retryAt, isLoading, onClose, onRetry, onSelect }: FrameworkDetailsDialogProperties): React.JSX.Element {
  const dialog = useRef<HTMLDialogElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const overviewTab = useRef<HTMLButtonElement>(null);
  const componentsTab = useRef<HTMLButtonElement>(null);
  const selectionButton = useRef<HTMLButtonElement>(null);
  const [activeTab, setActiveTab] = useState<FrameworkDetailsTab>("overview");
  const previewManifest = details ? getPreviewManifest(details) : undefined;

  useEffect(() => {
    const element = dialog.current!;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    element.showModal();
    closeButton.current?.focus({ preventScroll: true });
    return () => {
      element.close();
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  function dismissBackdrop(event: React.MouseEvent<HTMLDialogElement>): void {
    if (event.target !== event.currentTarget) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) onClose();
  }

  function selectTab(tab: FrameworkDetailsTab): void {
    setActiveTab(tab);
    (tab === "overview" ? overviewTab : componentsTab).current?.focus();
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
    const focusable = Array.from(dialog.current?.querySelectorAll<HTMLElement>("button:not([disabled]):not([tabindex='-1']), input:not([disabled]), iframe") ?? []);
    const currentIndex = focusable.indexOf(document.activeElement as HTMLElement);
    if (currentIndex === -1) {
      return;
    }
    if (currentIndex === 0 && event.shiftKey || currentIndex === focusable.length - 1 && !event.shiftKey) {
      event.preventDefault();
      focusable[event.shiftKey ? focusable.length - 1 : 0]?.focus();
    }
  }

  return <dialog ref={dialog} aria-label={`${details?.summary.name ?? "Framework"} details`} onKeyDown={trapFocus}
    onCancel={event => { event.preventDefault(); onClose(); }} onClick={dismissBackdrop}>
    <h2>{details?.summary.name ?? "Framework details"}</h2>
    {isLoading ? <p role="status">Loading framework details</p> : error ? <section><p role="alert">{error}</p><RetryButton retryAt={retryAt} onRetry={onRetry} /></section> : details && <>
      <div role="tablist" aria-label="Framework details">
        <button ref={overviewTab} type="button" role="tab" id="overview-tab" aria-controls="overview-panel" aria-selected={activeTab === "overview"} tabIndex={activeTab === "overview" ? 0 : -1} onClick={() => selectTab("overview")} onKeyDown={moveTab}>Overview</button>
        <button ref={componentsTab} type="button" role="tab" id="components-tab" aria-controls="components-panel" aria-selected={activeTab === "components"} tabIndex={activeTab === "components" ? 0 : -1} onClick={() => selectTab("components")} onKeyDown={moveTab}>Components</button>
      </div>
      {activeTab === "overview" ? <section role="tabpanel" id="overview-panel" aria-labelledby="overview-tab">
        <p>{details.summary.description}</p><p>{details.summary.technology} · {details.summary.componentCount} components</p>
        <h3>Capabilities</h3><ul>{(details.capabilities ?? []).map((capability) => <li key={capability.id}>{capability.description}</li>)}</ul>
        <h3>Suitable use cases</h3><ul>{(details.useCases ?? []).map((useCase) => <li key={useCase}>{useCase}</li>)}</ul>
        <p>Framework appearance is customized during implementation through its own themes and design tokens.</p>
      </section> : <section role="tabpanel" id="components-panel" aria-labelledby="components-tab">
        <ul>{(details.components ?? []).map((component) => <li key={component.id}><strong>{component.name}</strong><p>{component.description}</p></li>)}</ul>
        {previewManifest ? <ComponentPreviewPanel key={`${details.summary.id}:${details.summary.revision}:${previewManifest.buildId}`}
          manifest={previewManifest} frameworkName={details.summary.name} onDismiss={onClose}
          onFocusExit={direction => (direction === "forward" ? selectionButton : componentsTab).current?.focus()} />
          : <p>Component previews are unavailable for this framework revision.</p>}
      </section>}
      <button ref={selectionButton} type="button" onClick={onSelect}>Select framework</button>
    </>}
    <button ref={closeButton} type="button" onClick={onClose}>Close details</button>
  </dialog>;
}
