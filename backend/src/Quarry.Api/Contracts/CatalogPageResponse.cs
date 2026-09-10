namespace Quarry.Api.Contracts;

public sealed record CatalogPageResponse(
    IReadOnlyList<object> Items,
    int Total,
    bool HasNextPage,
    string? NextCursor,
    string CatalogRevision);
