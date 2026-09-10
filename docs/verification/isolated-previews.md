# Isolated preview verification

The Components tab loads a preview only when its manifest matches the framework ID, published revision, known component IDs, protocol, and configured asset origin. Missing or mismatched manifests retain the descriptors and explain that previews are unavailable.

The separate `@quarry/previews` workspace serves the labeled illustrative bundle without API or database access. Its allowlisted static assets carry CSP restrictions on connections, forms, objects, and embedding origins. Quarry grants the iframe only `allow-scripts`; messages require the current window, opaque origin, per-load token, and exact schema. Retry replaces both frame and token. Inputs and feedback remain inside the frame.

ATDD evidence: the initial preview tests failed on missing iframe and manifest gating. The native keyboard test was corrected to wait for readiness before entering the frame. A new switch-semantics assertion failed because the notifications control lacked that role; adding `role="switch"` made it pass.

Verification on 2026-09-10: all 39 browser tests passed, including six preview scenarios; both workspace builds passed. The subsequent missing-manifest case splits the invalid-manifest scenario into two cases. Tests exercise save/blank-name/reset/reopen, native Tab entry, both keyboard exits, Escape, five-second timeout/retry, forged and stale messages, and blocked parent DOM, cookies, storage, maintenance fetch, and top navigation. Backend traffic is mocked; the static preview host is real. These checks establish illustrative-bundle behavior, not released-framework provenance.

Backend publication of preview definitions is the next slice; until then live details have no preview manifest.
