namespace Quarry.Application.Catalog;

public sealed record FrameworkRetirementResult(FrameworkRetirementStatus Status, string? Revision = null, string? CatalogRevision = null);
