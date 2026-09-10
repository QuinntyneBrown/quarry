# Real-model relevance gate: not passed

The 2026-09-10 live evaluation uses the eight prescribed synthetic fixtures in [catalog.json](../../backend/evaluation/catalog.json), separate from the mock. Names carry an evaluation label, identities are stable GUIDs, and counts derive from the three fixture descriptors per entry. The practice fixture includes patient/client record-table support; intake includes client-record inputs. The first two veterinary query phrases are absent from names and descriptions.

The source catalog SHA-256 for this run is `7E44AD24AD48C02314DB9F6BBB26A81C977B2BD47EA5C91FA2EAD762F37EB985`. The isolated database catalog revision is `1`; fixture source revisions are `1`. These records are test data, not evidence of released component frameworks or completed preview harnesses.

`RealRelevanceEvaluationTests` creates a migrated temporary SQL database, generates real vectors with local Ollama, and sends the six synthetic queries through a real Kestrel HTTP search endpoint on a dynamic loopback port. It records every candidate's measured cosine and the actual returned IDs/order. No vectors, scores, or query-to-framework mappings are injected.

## Current production configuration

Model: `embeddinggemma:300m`; digest: `85462619ee721b466c5927d109d4cb765861907d5417b9109caebc4e614679f1`; dimensions: 768; input version: `quarry-embedding-v1`; current uncalibrated threshold: 0.5.

| Query | L2-006 judgment |
| --- | --- |
| Animal Hospital | Fail: intake precedes practice; booking is below threshold |
| I want to build a veterinary clinic application | Fail: analytics displaces booking |
| Online store | Pass: commerce first, product-grounded explanation |
| Analytics dashboard | Pass: analytics first, chart-grounded explanation |
| A pet care practice with booking, client records, and intake forms | Pass: practice and intake included |
| xyzzy unrecognized project | Fail: analytics exceeds threshold |

The baseline report preserves measurements and response contents under the ignored `test-results/relevance-history/` directory. Booking scores 0.489614 for `Animal Hospital`, while the strongest unrelated-query candidate scores 0.523598. Therefore no single threshold can both retain that required booking result and reject all unrelated-query results for this input construction. Threshold changes also cannot correct relative ranking.

## Input-format experiments

Google's [EmbeddingGemma model guidance](https://ai.google.dev/gemma/docs/embeddinggemma/model_card) recommends separate retrieval prefixes for documents and queries. The v2 experiment used those prefixes with the same catalog. The v3 experiment also added a uniform UI-component context to every query. Neither format satisfied the complete judgments, and neither is retained in production. Their generated reports are preserved in `test-results/relevance-history/`, outside source control. A further trial expanding all descriptions from their existing capabilities/use cases also failed; those expansions were discarded to retain the prescribed fixture basis.

The implementation plan's relevance gate remains failed. The threshold is not presented as calibrated, the model configuration is not accepted for release, and these results do not justify relaxing L2-006. Evaluating another local model requires resolving the model choice named in the implementation plan.

## Rerun

```powershell
$env:QUARRY_TEST_SQL = 'Server=.\SQLEXPRESS;Trusted_Connection=True;TrustServerCertificate=True;'
./tools/Test-QuarryRelevance.ps1
```

This command currently exits unsuccessfully because three required judgments fail. Each invocation creates a new directory under ignored `test-results/relevance/` containing the source commit, TRX, and JSON report. It enables the opt-in test only for the invocation, rejects skipped/missing tests, requires all six judgments to pass, and restores the caller's environment. It uses the same threshold constant as production ranking. Model/provider calls retain their five-second deadline; model acquisition/loading is setup work.

The verified Kestrel rerun on 2026-09-10 used Ollama 0.34.0 and reproduced all three failures with the catalog hash and model configuration above. The generated report additionally records dimensions, digest, input version, timestamp, and Ollama version. The single test executed with zero skips and correctly failed the command. No ranking behavior or criterion was weakened.

The manual `real-model relevance` workflow starts its own Windows LocalDB instance, downloads the official standalone Ollama distribution, acquires and warms the named model, invokes this command, retains artifacts even on failure, and stops its services. The provider verifies the pinned digest rather than trusting the model tag. The workflow YAML and PowerShell parsed successfully and the official download URL returned HTTP 200; the hosted workflow has not been pushed or dispatched. The opt-in real-model gate remains separate from tests using controlled query vectors to verify SQL mechanics.
