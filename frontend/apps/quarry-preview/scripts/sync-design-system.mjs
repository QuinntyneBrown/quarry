import { cp, access } from "node:fs/promises";
import { fileURLToPath } from "node:url";

// Copies Cornerstone's built docs-app ("design-system") static output into this app's public/
// directory so server.mjs can serve it under /design-systems/cornerstone/. Run after
// `npm run build:docs` in frameworks/cornerstone. Local/manual step, not wired into CI: the
// frontend e2e suite only ever asserts against a mocked design-system iframe src, so CI never
// needs the real built bundle.
const source = fileURLToPath(new URL("../../../../frameworks/cornerstone/dist/design-system/browser", import.meta.url));
const destination = fileURLToPath(new URL("../public/design-systems/cornerstone", import.meta.url));

try {
  await access(source);
} catch {
  throw new Error(`Cornerstone's design-system build was not found at ${source}. Run "npm run build:docs" in frameworks/cornerstone first.`);
}

await cp(source, destination, { recursive: true, force: true });
process.stdout.write(`Copied ${source} -> ${destination}\n`);
