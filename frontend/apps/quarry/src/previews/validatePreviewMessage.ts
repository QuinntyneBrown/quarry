import type { PreviewMessage } from "../types/PreviewMessage";

export function validatePreviewMessage(event: MessageEvent, frame: Window | null | undefined, session: string): PreviewMessage | undefined {
  if (!frame || event.source !== frame || event.origin !== "null") return;
  const data: unknown = event.data;
  if (!data || typeof data !== "object" || Array.isArray(data)) return;
  const message = data as Record<string, unknown>;
  if (message.sessionToken !== session || message.protocolVersion !== 1) return;
  const keys = Object.keys(message).sort().join(",");
  if (message.type === "focus-exit") {
    if (keys !== "direction,protocolVersion,sessionToken,type" || !["forward", "backward"].includes(String(message.direction))) return;
  } else if (!["ready", "failure", "dismiss"].includes(String(message.type)) || keys !== "protocolVersion,sessionToken,type") return;
  return message as PreviewMessage;
}
