using Quarry.Domain.Catalog;

namespace Quarry.Application.Catalog;

public sealed record FrameworkDraft(Guid Id, string Revision, string Status, int ComponentCount, FrameworkMetadata Metadata);
