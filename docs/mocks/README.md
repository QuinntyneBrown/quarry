# Quarry UI mock

A focused, standalone React + TypeScript design artifact based on `../prompt.md`.
Describe an application, review relevant frameworks with descriptions and tags,
inspect their capabilities and components, and select a framework.

## Run locally

Requires Node.js 22.12+ and npm.

```powershell
cd C:\projects\quarry\docs\mocks
npm ci
npm run dev
```

Open the local URL printed by Vite (normally `http://127.0.0.1:5173`).

```powershell
npm run build
npm run preview
```

The build produces static files in `dist/`. Serve them over HTTP. No API,
database, account, or model download is needed. Google Fonts is optional;
local font fallbacks work offline.

## Explore

- Type **Animal Hospital** and press Enter or **Find frameworks**. The mock
  recommends frameworks for appointments, records, intake, and client workflows.
- Try **veterinary clinic**: related wording produces the same relevant matches.
- Try **Online store** or **Analytics dashboard** to see recommendations change.
- Filter by technology; relevance ordering is preserved. Clear search to browse,
  or use **Browse all frameworks** to reset both the query and filter.
- Open a framework to read its description, tags, capabilities, and use cases.
  The Components tab has working inputs, buttons, and a switch, explicitly
  labeled as shared illustrative controls rather than released library components.
- Select a framework, review it from the floating summary, replace it by selecting
  another framework, or clear the selection. No color selection is involved.
- Ctrl/Cmd+K focuses search. Detail tabs support arrow keys; Escape closes details
  and returns focus. Query, filter, and selection survive detail navigation and
  reset on page reload.

Every framework supports custom themes and skins during implementation. The mock
uses a shared neutral presentation. Colors do not influence recommendations and
there are no palette galleries, swatches, or design-token selection controls.

## Recommendation simulation

The production requirement is **vector search over semantic embeddings of
framework descriptions and tags**, using the user's project description as a query.
That backend and embedding model are not implemented by this static design mock.

`src/recommendations.ts` uses a small, explicitly hand-authored concept vocabulary
and sample framework vectors, ranked with cosine similarity. It also supports
literal catalog-name, technology, tag, and use-case matches. It returns up to three
relevant results after the technology filter and a minimum similarity threshold.
Equal scores use ordinal stable-ID order. Empty-query browsing sorts by name,
then ID; nonempty punctuation-only input produces an empty result.
This demonstrates related-intent discovery, but does not understand arbitrary
language like a trained embedding model. Unknown queries show an honest empty
state. The UI labels recommendations as simulated and avoids confidence scores.

The catalog and capabilities are illustrative, including the Cornerstone entry.
UI components are not complete industry applications or clinical systems.

## Verification

```powershell
npm run typecheck
npx playwright install chromium
npm test
```

Playwright starts the local server and checks desktop/mobile behavior using a page
object and shared project-query fixtures at 1440 × 900 and 375 × 812. All nonlocal
traffic is blocked. Tests cover project-intent matches,
related queries, technology filtering, empty states, component interactions,
framework selection, and responsive layouts. No live API or database is used.
Build output, dependencies, screenshots, and browser reports are ignored by Git.

The mock follows the specified card breakpoints: one column below 768 CSS px,
two from 768 through 991, and three from 992 upward. Search submission occupies a
full-width row below 768 CSS px. The mock preserves the eight sample identities
and illustrative capability metadata; production descriptors and patient/client
evaluation augmentation belong in separate production fixtures.

Production-only API pagination, metadata revisions, service/429/indexing states,
real embeddings, and sandboxed framework bundles are specified in
[`../specs/L2.md`](../specs/L2.md) and [`../detailed-designs/`](../detailed-designs/README.md).
The local synchronous mock does not establish those behaviors or production
performance. Its sample component counts are illustrative, not derived from
released descriptors. Framework packages and their independent theme/build
evidence remain future delivery requirements.
