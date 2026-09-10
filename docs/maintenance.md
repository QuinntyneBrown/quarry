# Catalog maintenance

Use the configured operator token from [local setup](local-setup.md). Maintenance requires an authenticated `sub` and `permission: maintenance` claim. Public catalog routes cannot read drafts.

## Create and inspect a draft

`POST /api/maintenance/frameworks` accepts an operator-supplied GUID and metadata. A successful create returns 201, a maintenance `Location`, a decimal-string revision (`"1"` initially), status `draft`, normalized metadata, and a component count derived from descriptors. An existing identity returns 409 without overwriting it. Invalid fields return 400 with `code`, `correlationId`, and field-indexed `errors`.

The following is an illustrative draft only; substitute supported metadata from the actual framework before publication.

```powershell
$frameworkId = [Guid]::NewGuid().ToString('D')
$draftBody = @{
    id = $frameworkId
    name = 'Illustrative draft'
    description = 'Form controls for internal staff tools'
    technology = 'React'
    tags = @('forms')
    capabilities = @(@{ id = 'data-entry'; description = 'Supports text entry' })
    useCases = @('Internal staff tools')
    components = @(@{ id = 'text-input'; name = 'Text input'; description = 'Editable text' })
} | ConvertTo-Json -Depth 5
$headers = @{ Authorization = "Bearer $maintenanceToken" }
Invoke-RestMethod -Method Post -Uri 'https://localhost:7015/api/maintenance/frameworks' -Headers $headers -ContentType 'application/json' -Body $draftBody
Invoke-RestMethod -Uri "https://localhost:7015/api/maintenance/frameworks/$frameworkId" -Headers $headers
```

Names and descriptions are trimmed. Limits use UTF-16 string length after trimming:

| Field | Limit |
| --- | --- |
| Name | 1–200 characters |
| Description | 1–4,000 characters |
| Technology | React, Angular, Vue, or Web Components |
| Tags | 1–20 unique strings, each 1–100 characters |
| Suitable use cases | 1–20 unique strings, each 1–200 characters |
| Capabilities | 1–50; unique IDs of 1–100 characters and descriptions of 1–1,000 characters |
| Components | 1–200; unique IDs of 1–100 characters, names of 1–200 characters, descriptions of 1–1,000 characters |

Creation stores the private draft and an audit containing actor, framework ID, revision, operation, outcome, correlation ID, and time in one SQL transaction. It does not create indexing work. An audit-write failure rolls back the draft and returns a safe 503. Concurrent requests for one identity create at most one draft and one accepted audit entry.

## Update a draft

`PUT /api/maintenance/frameworks/{id}` accepts `expectedRevision` and a complete `metadata` object. Obtain both from the protected GET response. A successful update returns 200 with the next decimal-string revision. Revision values must stay strings to preserve numeric precision. Blank, noncanonical, or out-of-range revisions return 400; an outdated revision returns 409 with `revision_conflict`. Reload the draft before submitting a revised update. An unknown ID returns 404.

```powershell
$draft = Invoke-RestMethod -Uri "https://localhost:7015/api/maintenance/frameworks/$frameworkId" -Headers $headers
$draft.metadata.description = 'Revised description supported by framework documentation'
$update = @{ expectedRevision = $draft.revision; metadata = $draft.metadata } | ConvertTo-Json -Depth 8
Invoke-RestMethod -Method Put -Uri "https://localhost:7015/api/maintenance/frameworks/$frameworkId" -Headers $headers -ContentType 'application/json' -Body $update
```

Updates use the same metadata validation as creation. The draft revision, metadata, and `framework-update` audit commit together. Concurrent updates with the same expected revision accept only one writer. Editing the draft leaves an existing published entry and its search index unchanged.

## Publish a draft

`POST /api/maintenance/frameworks/{id}/publish` accepts `expectedRevision` and an `evidence` array. Each reference supplies `targetType` (`capability` or `component`), `targetId`, `kind` (`documentation` or `working-example`), and `source` (an absolute HTTPS URL without credentials, at most 2,000 characters). Supply 1–250 references covering every capability and component in the draft. Operators must review the referenced material: the API validates reference structure and coverage, but does not fetch or verify source content.

```powershell
$draft = Invoke-RestMethod -Uri "https://localhost:7015/api/maintenance/frameworks/$frameworkId" -Headers $headers
$publish = @{
    expectedRevision = $draft.revision
    evidence = @(
        @{ targetType = 'capability'; targetId = 'data-entry'; kind = 'documentation'; source = 'https://example.test/docs/data-entry' }
        @{ targetType = 'component'; targetId = 'text-input'; kind = 'working-example'; source = 'https://example.test/examples/text-input' }
    )
} | ConvertTo-Json -Depth 8
# Replace the illustrative evidence URLs with reviewed framework references.
Invoke-RestMethod -Method Post -Uri "https://localhost:7015/api/maintenance/frameworks/$frameworkId/publish" -Headers $headers -ContentType 'application/json' -Body $publish
```

Success returns 200 with `id`, the next framework `revision`, the incremented `catalogRevision`, and status `published`. The draft advances to that same framework revision. Public browse and details expose the published metadata immediately; semantic search includes it after the worker finishes indexing that revision. A stale expected revision returns 409, an unknown identity returns 404, and invalid evidence returns 400.

The public metadata, immutable snapshot with evidence, catalog revision, index work, and `framework-publish` audit commit in one SQL transaction. Audit or index scheduling failures roll everything back and return a safe 503. Republishing preserves earlier snapshots; SQL rejects updates and deletes of snapshot rows. Draft edits continue to leave the current publication unchanged until the next successful publication.

## Withdraw or delete

`POST /api/maintenance/frameworks/{id}/withdraw` and `DELETE /api/maintenance/frameworks/{id}` accept a JSON body containing `expectedRevision`, obtained from the maintenance GET. Both require the same operator credentials. Success returns 200 with `id`, the next framework `revision`, current `catalogRevision`, and status `withdrawn` or `deleted`.

Withdrawal requires a currently published entry. It immediately removes browse, details, and search eligibility, while retaining the editable draft for later publication with new evidence. Withdrawing an unpublished draft or an already withdrawn entry returns 409.

Deletion accepts a private draft, published entry, or withdrawn entry. It reserves the identity permanently and retains audit records and immutable publication history. Maintenance reads, updates, publication, and further deletion then return 404; creating another draft with that ID returns 409. Deletion is a lifecycle operation, not a purge of historical records.

Both operations reject stale revisions with 409 and invalid revisions with 400. Removing a public entry increments the catalog revision; deleting a private draft does not. Audit and state changes commit together, and an audit failure rolls everything back. Previous vectors can remain stored but cannot qualify for discovery; pending or leased indexing work cannot restore a retired publication and is marked superseded when processed.

```powershell
$draft = Invoke-RestMethod -Uri "https://localhost:7015/api/maintenance/frameworks/$frameworkId" -Headers $headers
$change = @{ expectedRevision = $draft.revision } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri "https://localhost:7015/api/maintenance/frameworks/$frameworkId/withdraw" -Headers $headers -ContentType 'application/json' -Body $change
# For permanent retirement, retrieve the latest revision and use DELETE on the framework URI.
```
