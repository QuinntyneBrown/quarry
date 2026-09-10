import { createServer } from "node:http";

const summary = {
  id: "e0000000-0000-4000-8000-000000000001", name: "Local API fixture", description: "Illustrative routing fixture",
  technology: "React", tags: ["Forms"], componentCount: 1, revision: "1"
};

createServer(async (request, response) => {
  const url = new URL(request.url, "http://127.0.0.1");
  response.setHeader("Content-Type", "application/json");
  response.setHeader("Cache-Control", "no-store");
  if (request.method === "GET" && url.pathname === "/api/frameworks") {
    const items = !url.searchParams.get("technology") || url.searchParams.get("technology") === "React" ? [summary] : [];
    response.end(JSON.stringify({ items, total: items.length, hasNextPage: false, nextCursor: null, catalogRevision: "1" }));
  } else if (request.method === "GET" && url.pathname === `/api/frameworks/${summary.id}`) {
    response.end(JSON.stringify({ summary, capabilities: [{ id: "forms", description: "Accessible forms" }],
      useCases: ["Data entry"], components: [{ id: "input", name: "Text input", description: "A labeled field" }] }));
  } else if (request.method === "POST" && url.pathname === "/api/framework-searches") {
    let body = "";
    for await (const chunk of request) body += chunk;
    const query = JSON.parse(body).query;
    if (query === "Service failure fixture") {
      response.writeHead(503); response.end(JSON.stringify({ code: "embedding_service_unavailable", correlationId: "routing-fixture" }));
    } else response.end(JSON.stringify({ items: [{ ...summary, rank: 1, explanation: "Accessible forms", supportingCapabilityIds: ["forms"] }], catalogRevision: "1", isIndexIncomplete: false }));
  } else { response.writeHead(404); response.end(JSON.stringify({ code: "fixture_route_not_found" })); }
}).listen(4191, "127.0.0.1", () => process.stdout.write("Routing mock listening on 4191\n"));
