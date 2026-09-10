import { createServer } from "node:http";
import { readFile } from "node:fs/promises";

const port = Number(process.env.QUARRY_PREVIEW_PORT ?? 4180);
const appOrigins = (process.env.QUARRY_APP_ORIGINS ?? "http://127.0.0.1:4173 http://127.0.0.1:5173").split(" ");
for (const origin of appOrigins) {
  const parsed = new URL(origin);
  if (parsed.origin !== origin || !["http:", "https:"].includes(parsed.protocol)) throw new Error("Configure explicit application origins.");
}
const assets = new Map([
  ["/bundles/illustrative-v1/index.html", "text/html; charset=utf-8"],
  ["/bundles/illustrative-v1/preview.js", "text/javascript; charset=utf-8"],
  ["/bundles/illustrative-v1/preview.css", "text/css; charset=utf-8"]
]);
const policy = "default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'none'; img-src 'none'; font-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors " + appOrigins.join(" ");
const server = createServer(async (request, response) => {
  const pathname = new URL(request.url ?? "/", "http://localhost").pathname;
  const type = assets.get(pathname);
  const headers = {
    "Content-Security-Policy": policy, "X-Content-Type-Options": "nosniff", "Referrer-Policy": "no-referrer",
    "Access-Control-Allow-Origin": "*", "Cross-Origin-Resource-Policy": "cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=(), fullscreen=()"
  };
  if (!type || !["GET", "HEAD"].includes(request.method ?? "")) {
    response.writeHead(404, headers); response.end(); return;
  }
  try {
    const body = await readFile(new URL("./public" + pathname, import.meta.url));
    response.writeHead(200, { ...headers, "Content-Type": type, "Cache-Control": "public, max-age=31536000, immutable" });
    response.end(request.method === "HEAD" ? undefined : body);
  } catch {
    response.writeHead(503, headers); response.end();
  }
});
server.listen(port, "127.0.0.1", () => process.stdout.write(`Preview assets listening on http://localhost:${port}\n`));
