namespace Quarry.Application.Catalog;

public sealed record PublicationResult(PublicationStatus Status, Guid Id, string? Revision = null, string? CatalogRevision = null);
