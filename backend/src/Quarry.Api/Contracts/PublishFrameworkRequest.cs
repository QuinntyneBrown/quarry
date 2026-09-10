using Quarry.Domain.Catalog;

namespace Quarry.Api.Contracts;

public sealed record PublishFrameworkRequest(string? ExpectedRevision, IReadOnlyList<PublicationEvidence?>? Evidence);
