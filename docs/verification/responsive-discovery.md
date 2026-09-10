# Responsive discovery presentation

The browsing application now adapts the standalone mock's brand mark, centered search area, restrained blue/gray palette, technology filter, card hierarchy, tags, recommendation panels, selection summary, and detail presentation. It uses system fonts and existing published API metadata; it adds no invented component imagery or hard-coded recommendations. The standalone mock remains unchanged.

L2-024/L2-025 acceptance coverage adds all 11 required viewport sizes: 320×740, 375×812, 575×800, 576×800, 767×800, 768×1024, 991×800, 992×800, 1199×800, 1200×900, and 1440×900. Shared backend mocks and page objects exercise browsing, a submitted search, Overview/Components, selection, a catalog failure/retry, and empty results at each size. Assertions measure actual card rows (one/two/three columns), horizontal overflow, mobile submit-row geometry, control target sizes, and activation of the final card while selection remains visible.

The keyboard entry test activates a visible skip link and verifies focus on the results heading. Detail arrows now wrap in either direction; Home/End retain their specified destinations. Dialog naming references its visible heading. Result-count announcements use a dedicated live region rather than announcing the whole card grid.

ATDD on 2026-09-10 reproduced a 10,946 CSS-pixel horizontal overflow from a valid unbroken 500-character query and the missing skip link. Both now pass. All 12 new tests and the complete 69-test browser suite passed; application and preview workspace builds passed. Desktop/mobile catalog screenshots and the detail presentation were visually reviewed. Screenshots are generated under ignored Playwright `test-results` and are included in CI artifacts.

One preview keyboard scenario failed in the first concurrent regression run and passed in a focused run and the subsequent complete run; no timing requirement was relaxed. Keep this intermittent result visible when extending the browser matrix.

This establishes the measured layout scenarios, not full completion of L2-024 through L2-027. Remaining checks include pending/detail-error/real-preview layouts throughout the matrix, every existing interaction at one viewport per band, contrast measurements, 200% browser zoom, reduced-motion execution, and field-error accessibility. The CSS already disables nonessential transitions/animation for reduced motion, but that preference still needs explicit browser evidence.
