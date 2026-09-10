import type { FrameworkDetails } from "../types/FrameworkDetails";
import type { PreviewManifest } from "../types/PreviewManifest";

export function getPreviewManifest(details: FrameworkDetails): PreviewManifest | undefined {
  const manifest = details.previewManifest;
  if (!manifest || manifest.frameworkId !== details.summary.id || manifest.revision !== details.summary.revision
      || manifest.protocolVersion !== 1 || typeof manifest.isIllustrative !== "boolean"
      || typeof manifest.buildId !== "string" || !/^[a-z0-9-]{1,64}$/.test(manifest.buildId)
      || !Array.isArray(manifest.componentIds) || manifest.componentIds.length === 0 || manifest.componentIds.length > 200
      || new Set(manifest.componentIds).size !== manifest.componentIds.length
      || manifest.componentIds.some(id => !details.components?.some(component => component.id === id))) return;
  try {
    const allowed = new URL(import.meta.env.VITE_PREVIEW_ORIGIN ?? "http://localhost:4180");
    const uri = new URL(manifest.previewUri);
    if (uri.origin !== allowed.origin || uri.hostname === window.location.hostname || uri.username || uri.password
        || uri.search || uri.hash || uri.pathname !== `/bundles/${manifest.buildId}/index.html`) return;
    return manifest;
  } catch { return; }
}
