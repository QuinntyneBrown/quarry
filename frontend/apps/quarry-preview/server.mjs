import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname } from "node:path";

const port = Number(process.env.QUARRY_PREVIEW_PORT ?? 4180);
const appOrigins = (process.env.QUARRY_APP_ORIGINS ?? "http://127.0.0.1:4173 http://127.0.0.1:5173").split(" ");
for (const origin of appOrigins) {
  const parsed = new URL(origin);
  if (parsed.origin !== origin || !["http:", "https:"].includes(parsed.protocol)) throw new Error("Configure explicit application origins.");
}

const bundleAssets = new Map([
  ["/bundles/illustrative-v1/index.html", "text/html; charset=utf-8"],
  ["/bundles/illustrative-v1/preview.js", "text/javascript; charset=utf-8"],
  ["/bundles/illustrative-v1/preview.css", "text/css; charset=utf-8"]
]);
const bundlePolicy = "default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'none'; img-src 'none'; font-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors " + appOrigins.join(" ");

// A whole framework's built design-system app (e.g. Cornerstone's docs-app) is not a single
// known-filename bundle like /bundles/: it ships arbitrary chunked JS/CSS/JSON/fonts under its
// own directory, so this route serves any file under public/design-systems/<slug>/ by extension
// instead of an exact-match allowlist. Its CSP is scoped to 'self' rather than 'none' because the
// app fetches its own bundled JSON and assets at runtime; frame-ancestors stays restricted the
// same way as the bundle route.
const designSystemContentTypes = new Map([
  [".html", "text/html; charset=utf-8"], [".js", "text/javascript; charset=utf-8"], [".mjs", "text/javascript; charset=utf-8"],
  [".css", "text/css; charset=utf-8"], [".json", "application/json; charset=utf-8"], [".svg", "image/svg+xml"],
  [".png", "image/png"], [".jpg", "image/jpeg"], [".jpeg", "image/jpeg"], [".gif", "image/gif"], [".webp", "image/webp"],
  [".ico", "image/x-icon"], [".woff", "font/woff"], [".woff2", "font/woff2"], [".ttf", "font/ttf"],
  [".map", "application/json; charset=utf-8"], [".txt", "text/plain; charset=utf-8"], [".webmanifest", "application/manifest+json"]
]);
const designSystemPolicy = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self'; img-src 'self' data:; font-src 'self'; object-src 'none'; base-uri 'self'; form-action 'none'; frame-ancestors " + appOrigins.join(" ");

function resolveDesignSystemAsset(pathname) {
  const match = /^\/design-systems\/([a-z0-9-]{1,64})\/(.*)$/.exec(pathname);
  if (!match) return null;
  const [, slug, rest] = match;
  const relativePath = rest === "" ? "index.html" : rest;
  const segments = relativePath.split("/");
  if (segments.some(segment => segment === "" || segment === "." || segment === "..")) return null;
  const type = designSystemContentTypes.get(extname(relativePath));
  if (!type) return null;
  return { assetPath: `./public/design-systems/${slug}/${relativePath}`, type };
}

const server = createServer(async (request, response) => {
  const pathname = new URL(request.url ?? "/", "http://localhost").pathname;
  if (!["GET", "HEAD"].includes(request.method ?? "")) {
    response.writeHead(404); response.end(); return;
  }

  const bundleType = bundleAssets.get(pathname);
  const designSystemAsset = bundleType ? null : resolveDesignSystemAsset(pathname);
  const headers = {
    "Content-Security-Policy": bundleType ? bundlePolicy : designSystemPolicy,
    "X-Content-Type-Options": "nosniff", "Referrer-Policy": "no-referrer",
    "Access-Control-Allow-Origin": "*", "Cross-Origin-Resource-Policy": "cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=(), fullscreen=()"
  };
  if (!bundleType && !designSystemAsset) {
    response.writeHead(404, headers); response.end(); return;
  }

  try {
    const body = await readFile(new URL(bundleType ? "./public" + pathname : designSystemAsset.assetPath, import.meta.url));
    response.writeHead(200, { ...headers, "Content-Type": bundleType ?? designSystemAsset.type, "Cache-Control": "public, max-age=31536000, immutable" });
    response.end(request.method === "HEAD" ? undefined : body);
  } catch {
    response.writeHead(503, headers); response.end();
  }
});
server.listen(port, "127.0.0.1", () => process.stdout.write(`Preview assets listening on http://localhost:${port}\n`));
