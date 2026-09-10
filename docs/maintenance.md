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

Draft update, publication with supporting evidence, withdrawal, deletion, and immutable published history are subsequent implementation increments. The create/read routes do not publish entries.
