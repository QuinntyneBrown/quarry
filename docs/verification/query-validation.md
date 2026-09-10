# Accessible query validation

L2-026/L2-029 verification on 2026-09-10 covers trimmed UTF-16 lengths 0, 1, 500, and 501 plus null. Supplementary Unicode characters ensure the test counts code units rather than code points. Empty text browses without embedding; 1 and 500 reach the controlled embedding dependency; 501 and null return 400 `invalid_search_query`, a correlation ID, and `errors.query` without dependency work or reflected input.

The browser recognizes that stable rejection code and supplies its own safe message. The field exposes `aria-invalid` and an associated description; one alert announces the message without moving focus. It offers correction rather than retrying the unchanged invalid request. Successful submission clears the invalid state. Clear/browse also clears it. Unrecognized failures retain the normal service-recovery behavior.

ATDD: the API tests first failed because `errors.query` was missing, and the browser test failed because `aria-invalid` was absent. Five API boundary cases and the browser correction scenario now pass. The broader run passed 121 ordinary backend tests and 70 browser tests; backend, application, and preview builds passed. Real-model tests were excluded from the backend regression run.
