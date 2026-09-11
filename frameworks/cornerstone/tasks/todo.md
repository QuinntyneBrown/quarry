# Repository layout migration

- [x] Move projects, flatten component folders, and rewrite direct imports and paths.
- [x] Preserve explicit public exports and catalog categories.
- [x] Extract authoritative tokens and preserve packaged UI stylesheet imports.
- [x] Create independent manual and deterministic acceptance harnesses.
- [x] Separate browser specifications and page objects; retain documentation scenarios.
- [x] Update build, release, deployment, and contributor instructions.
- [x] Verify public API parity, generated output, formatting, architecture, and lint.
- [x] Verify unit coverage, token behavior, all builds, and packed consumers.
- [x] Verify package contents, size budgets, and all browser scenarios.

Verification: 491 public symbols preserved; 6 unit tests and 2 token tests passed;
coverage thresholds unchanged; all 18 Playwright scenarios passed across Chromium,
Firefox, and WebKit, including all 144 components in both docs and acceptance apps.
The manual harness and watch-mode token packaging were also exercised. Packed
consumer imports, stylesheet entry points, schematics, and size budgets passed.
