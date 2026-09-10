# Detail modal verification

The detail dialog now uses the browser's modal top layer, blocking background focus while preserving the existing keyboard and preview boundaries. It locks background scrolling, constrains long content to the viewport with internal scrolling, closes on a backdrop click or Escape, and restores the opener without scrolling discovery.

ATDD on 2026-09-10: the new mobile/desktop tests first failed because the long dialog extended below the viewport; the backdrop test failed because clicking outside did not dismiss it. The three scenarios now pass at 375×720 and 1280×720, verifying inert background focus, wheel-scroll isolation, unchanged discovery scroll and draft input, opener focus, inside clicks, and backdrop dismissal. The complete browser suite passes all 43 tests, including preview keyboard boundaries and existing Escape/Tab tests. Both workspace builds pass.

This slice does not establish the full viewport/accessibility matrix or selected-framework revision reconciliation; those remain separate completion gates.
