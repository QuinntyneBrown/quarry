# Browser request cancellation

Discovery requests now share a cancellation controller across search, filtering, reset, and pagination. Each new request invalidates the old identity and aborts the old fetch. Detail requests have an independent controller that is aborted on replacement, dismissal, or page unmount. Identity checks still protect state if an obsolete response has already completed.

ATDD evidence on 2026-09-10: all five new scenarios initially failed because the browser never reported the obsolete request as aborted. They now observe actual browser request failures when a search is superseded by submission, clear, or filter; when a catalog filter changes; and when pending details close. Current content, focus, and error state remain correct. All 48 browser tests and both workspace builds pass, including the existing late-response test.

These isolated tests mock every API request. They prove browser cancellation, not the separate live-server cancellation latency and overload-recovery gates.
