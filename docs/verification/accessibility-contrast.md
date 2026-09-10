# Browser contrast and semantic checks

The application uses `@axe-core/playwright` pinned to 4.13.0 for WCAG 2 A/AA and 2.1 AA automated checks, following [Playwright's accessibility testing guidance](https://playwright.dev/docs/accessibility-testing). These automated checks do not establish formal accessibility certification.

Two scenarios run at each of the five viewport bands. They audit catalog browsing, recommendations, Overview, selection, service failure, empty results, Components with the real sandboxed illustrative preview, preview feedback, and query validation. Each state writes JSON under the ignored Playwright output directory with violations, text/background measurements, incomplete findings, and any direct measurements used to resolve them. CI retains those reports alongside JUnit, screenshots, and failure traces.

Every axe violation fails. Incomplete contrast findings also fail unless they are the decorative diamond glyph or axe's background-inference limitation within the native dialog/sticky selection layer. Those cases receive direct sRGB relative-luminance measurements against their nearest opaque solid background: at least 3:1 for the graphic and the reported 4.5:1 or 3:1 text threshold. The fallback refuses translucent colors, image backgrounds, ancestor opacity, and filters. It does not disable an axe rule or exclude a page region. Screenshots of reported dialog and sticky-layer cases were reviewed before applying this bounded fallback.

Separate assertions measure the search boundary, select boundary, submit fill, keyboard focus outline, active-tab underline, and selected-card border at 3:1 or better. Selection is also expressed in text and tab state in `aria-selected`. The real preview is included in the automated scan rather than replaced with a parent-page imitation.

The focused ten-test matrix passed on 2026-09-10. During verification, a trace showed the test filling the background search field before the iframe's asynchronous Escape dismissal finished. The page object now waits for the dialog to disappear before the next interaction; no application timing or security requirement was weakened.

The complete browser suite then passed **322 tests in 3.8 minutes** with `CI=true` and two workers. Its 45 state reports contained zero violations and zero unresolved contrast findings. The application production build and preview-host syntax build both passed. The CI build now includes both workspaces.

The separate [responsive verification](responsive-discovery.md) covers control sizes, scrolling, all viewport boundaries, and reduced motion. Actual 200% browser-zoom verification remains outstanding.
