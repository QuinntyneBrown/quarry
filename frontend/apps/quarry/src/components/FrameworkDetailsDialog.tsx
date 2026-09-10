import { useEffect, useRef, useState } from "react";
import type { FrameworkDetailsDialogProperties } from "../types/FrameworkDetailsDialogProperties";
import type { FrameworkDetailsTab } from "../types/FrameworkDetailsTab";
import { RetryButton } from "./RetryButton";

export function FrameworkDetailsDialog({ details, error, retryAt, isLoading, onClose, onRetry, onSelect }: FrameworkDetailsDialogProperties): React.JSX.Element {
  const dialog = useRef<HTMLDialogElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const overviewTab = useRef<HTMLButtonElement>(null);
  const componentsTab = useRef<HTMLButtonElement>(null);
  const [activeTab, setActiveTab] = useState<FrameworkDetailsTab>("overview");
  const [displayName, setDisplayName] = useState("Jamie");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [previewFeedback, setPreviewFeedback] = useState("");

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

  function savePreview(): void {
    setPreviewFeedback(`Changes saved for ${displayName.trim() || "you"} in the preview`);
  }

  function resetPreview(): void {
    setDisplayName("Jamie");
    setNotificationsEnabled(true);
    setPreviewFeedback("Preview reset");
  }

  function trapFocus(event: React.KeyboardEvent<HTMLDialogElement>): void {
    if (event.key !== "Tab") {
      return;
    }
    const focusable = Array.from(dialog.current?.querySelectorAll<HTMLElement>("button:not([disabled]):not([tabindex='-1']), input:not([disabled])") ?? []);
    const currentIndex = focusable.indexOf(document.activeElement as HTMLElement);
    if (currentIndex === -1) {
      return;
    }
    event.preventDefault();
    focusable[(currentIndex + (event.shiftKey ? -1 : 1) + focusable.length) % focusable.length]?.focus();
  }

  return <dialog ref={dialog} open aria-label={`${details?.summary.name ?? "Framework"} details`} onKeyDown={trapFocus}>
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
        {(details.components ?? []).length === 0 ? <p>Component previews are unavailable for this framework revision.</p> : <>
          <ul>{details.components.map((component) => <li key={component.id}><strong>{component.name}</strong><p>{component.description}</p></li>)}</ul>
          <section aria-label="Illustrative component preview">
            <p>This illustrative preview is local to this dialog.</p>
            <label>Display name <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} /></label>
            <label><input type="checkbox" checked={notificationsEnabled} onChange={(event) => setNotificationsEnabled(event.target.checked)} /> Email notifications</label>
            <button type="button" onClick={savePreview}>Save changes</button>
            <button type="button" onClick={resetPreview}>Reset</button>
            {previewFeedback && <p role="status">{previewFeedback}</p>}
          </section>
        </>}
      </section>}
      <button type="button" onClick={onSelect}>Select framework</button>
    </>}
    <button ref={closeButton} type="button" onClick={onClose}>Close details</button>
  </dialog>;
}
