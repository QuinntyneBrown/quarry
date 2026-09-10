import { useEffect, useRef, useState } from "react";
import type { ComponentPreviewPanelProperties } from "../types/ComponentPreviewPanelProperties";
import { validatePreviewMessage } from "../previews/validatePreviewMessage";

export function ComponentPreviewPanel({ manifest, frameworkName, onDismiss, onFocusExit }: ComponentPreviewPanelProperties): React.JSX.Element {
  const frame = useRef<HTMLIFrameElement>(null);
  const [session, setSession] = useState(() => crypto.randomUUID());
  const [status, setStatus] = useState<"loading" | "ready" | "failed">("loading");
  const callbacks = useRef({ onDismiss, onFocusExit });
  callbacks.current = { onDismiss, onFocusExit };
  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => { active = false; setStatus("failed"); }, 5000);
    function receive(event: MessageEvent): void {
      if (!active) return;
      const message = validatePreviewMessage(event, frame.current?.contentWindow, session);
      if (!message) return;
      if (message.type === "ready") { window.clearTimeout(timer); setStatus("ready"); }
      if (message.type === "failure") { active = false; window.clearTimeout(timer); setStatus("failed"); }
      if (message.type === "dismiss") callbacks.current.onDismiss();
      if (message.type === "focus-exit") callbacks.current.onFocusExit(message.direction!);
    }
    window.addEventListener("message", receive);
    return () => { active = false; window.clearTimeout(timer); window.removeEventListener("message", receive); };
  }, [session]);
  function initialize(): void {
    frame.current?.contentWindow?.postMessage({ type: "init", sessionToken: session, protocolVersion: 1 }, "*");
  }
  function retry(): void { setStatus("loading"); setSession(crypto.randomUUID()); }
  return <section aria-label="Component preview">
    {manifest.isIllustrative && <p>Illustrative preview — not a released framework build.</p>}
    {status === "loading" && <p role="status">Loading component preview</p>}
    {status === "failed" ? <section><p role="alert">The component preview is unavailable. You can retry or continue reviewing this framework.</p><button type="button" onClick={retry}>Retry preview</button></section>
      : <iframe ref={frame} key={session} title={`${frameworkName} component preview`} src={manifest.previewUri}
          sandbox="allow-scripts" referrerPolicy="no-referrer" onLoad={initialize}
          allow="camera 'none'; microphone 'none'; geolocation 'none'; payment 'none'; fullscreen 'none'"
          style={{ width: "100%", height: "350px", border: "1px solid #ccd3de" }} />}
  </section>;
}
