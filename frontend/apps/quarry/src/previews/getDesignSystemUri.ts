import type { FrameworkDetails } from "../types/FrameworkDetails";

export function getDesignSystemUri(details: FrameworkDetails): string | undefined {
  const value = details.designSystemUri;
  if (!value) return;
  try {
    const uri = new URL(value);
    if (uri.username || uri.password) return;
    if (uri.protocol === "https:") return value;
    if (uri.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(uri.hostname)) return value;
    return;
  } catch { return; }
}
