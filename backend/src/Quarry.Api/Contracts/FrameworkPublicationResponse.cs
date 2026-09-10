namespace Quarry.Api.Contracts;

public sealed record FrameworkPublicationResponse(Guid Id, string Revision, string CatalogRevision, string Status);
