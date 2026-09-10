using Quarry.Domain.Catalog;

namespace Quarry.Api.Contracts;

public sealed record UpdateFrameworkDraftRequest(string? ExpectedRevision, FrameworkMetadata? Metadata);
