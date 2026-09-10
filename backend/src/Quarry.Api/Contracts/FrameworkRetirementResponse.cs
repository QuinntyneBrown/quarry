namespace Quarry.Api.Contracts;

public sealed record FrameworkRetirementResponse(Guid Id, string Revision, string CatalogRevision, string Status);
