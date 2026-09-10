# Windows continuous integration

The ordinary `verify` workflow builds the backend in Release, starts a dedicated LocalDB instance, supplies `QUARRY_TEST_SQL`, and runs API acceptance tests. Tests migrate and remove their own temporary databases. A TRX check rejects zero tests, skipped tests, and failures. The two opt-in real-model test classes are excluded from this ordinary job; passing it does not establish semantic relevance or real-model performance.

The browser job runs Playwright with all backend interactions mocked and starts the isolated preview host through Playwright configuration. Backend TRX and frontend JUnit results are retained as workflow artifacts, including on failure. Missing reports fail artifact collection. Both jobs have a 15-minute timeout and read-only repository permissions. Manual dispatch is also available.

GitHub's [Windows runner inventory](https://github.com/actions/runner-images/blob/main/images/windows/Windows2025-Readme.md) lists LocalDB. The startup step uses the [documented LocalDB utility](https://learn.microsoft.com/en-us/sql/database-engine/configure-windows/sql-server-express-localdb?view=sql-server-ver17) and fails immediately if the instance cannot start.

Local verification on 2026-09-10 used Express because this ARM64 machine cannot load the LocalDB connection library:

- The Release backend build passed with zero warnings and errors.
- The workflow's test selection and TRX guard passed: 109 executed, 109 passed, zero skipped.
- Deliberately omitting `QUARRY_TEST_SQL` caused two seed tests to skip; the same guard correctly rejected those results.
- The workflow's Playwright reporter command passed 57 tests under `CI=true`, producing JUnit with zero failures and skips.
- Workflow YAML parsed successfully. The hosted GitHub job has not been dispatched or verified from this workspace.

The separate manual [real-model relevance workflow](../../.github/workflows/relevance.yml) now runs the six synthetic judgments with local Ollama and SQL, retains JSON/TRX evidence, and rejects skipped tests or unmet judgments. Its local command has been verified to fail for the three documented [relevance failures](relevance-evaluation.md). Hosted execution is still unverified. The specified benchmark/recovery jobs remain separate delivery work; the ordinary workflow does not substitute for those gates.
