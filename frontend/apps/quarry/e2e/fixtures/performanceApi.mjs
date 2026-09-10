import { createServer } from "node:http";

// Synthetic browser workload only. No persistence, vectors, or semantic results.
const catalog = Array.from({ length: 1000 }, (_, index) => ({
  id: `e0000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
  name: `Illustrative framework ${String(index + 1).padStart(4, "0")}`,
  description: "Synthetic browser performance fixture. Accessible forms, navigation, and data displays. ".repeat(30).slice(0, 2000),
  technology: "React",
  tags: Array.from({ length: 20 }, (_, tag) => `Fixture tag ${tag + 1}`),
  componentCount: 1, revision: "1"
}));

createServer((request, response) => {
  const url = new URL(request.url, "http://127.0.0.1");
  response.setHeader("Content-Type", "application/json");
  response.setHeader("Cache-Control", "no-store");
  if (request.method === "GET" && url.pathname === "/api/frameworks") {
    const offset = Number(url.searchParams.get("cursor") ?? 0);
    if (!Number.isInteger(offset) || offset < 0 || offset >= catalog.length) {
      response.writeHead(400); response.end(JSON.stringify({ code: "invalid_fixture_cursor" })); return;
    }
    const items = catalog.slice(offset, offset + 24);
    const hasNextPage = offset + items.length < catalog.length;
    response.end(JSON.stringify({ items, total: catalog.length, hasNextPage,
      nextCursor: hasNextPage ? String(offset + items.length) : null, catalogRevision: "1" }));
  } else if (request.method === "GET" && url.pathname.startsWith("/api/frameworks/")) {
    const summary = catalog.find(item => url.pathname === `/api/frameworks/${item.id}`);
    if (!summary) { response.writeHead(404); response.end(JSON.stringify({ code: "fixture_not_found" })); return; }
    response.end(JSON.stringify({ summary, capabilities: [{ id: "forms", description: "Illustrative profile forms" }],
      useCases: ["Browser performance measurement"],
      components: [{ id: "profile-controls", name: "Illustrative profile controls", description: "Text, switch, save and reset." }],
      previewManifest: { frameworkId: summary.id, revision: summary.revision,
        previewUri: "http://localhost:4180/bundles/illustrative-v1/index.html",
        componentIds: ["profile-controls"], buildId: "illustrative-v1", protocolVersion: 1, isIllustrative: true }
    }));
  } else {
    response.writeHead(500);
    response.end(JSON.stringify({ code: "unexpected_performance_fixture_request" }));
  }
}).listen(4193, "127.0.0.1", () => process.stdout.write("Browser performance mock listening on 4193\n"));
