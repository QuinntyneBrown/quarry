# Selection reconciliation

Selecting a framework now keeps details open, names the framework in the action, and changes that action to `Selected`. Selecting it again is idempotent. Reviewing a newer published revision updates the in-memory selection summary, including technology. A 404 marks that ID unavailable without replacing it, omits retry for the missing detail, and retains clearing/replacement. A service error remains retryable and does not imply withdrawal.

Clear now announces `No framework selected.` and restores focus to the selected card when present or the programmatically focusable results heading otherwise. Closing details also has a results-heading fallback when its opener no longer exists. Nothing is persisted across browser sessions.

ATDD on 2026-09-10: the new scenario first failed because the framework-specific selection action was absent. Five scenarios now pass for staying in details, repeated selection, newer revision review, 404 versus 503, replacement, and clearing with a present/absent card. Existing helper journeys explicitly close details after selection to continue browsing. All 53 browser tests and both workspace builds pass.

Recommendation/detail revision notices and explanation reconciliation remain separate work; these tests establish selection-summary reconciliation only.
