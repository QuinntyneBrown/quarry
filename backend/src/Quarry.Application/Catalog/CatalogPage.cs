namespace Quarry.Application.Catalog;

public sealed record CatalogPage(
    IReadOnlyList<FrameworkSummary> Items,
    int Total,
    bool HasNextPage,
    string? NextCursor,
    string CatalogRevision);
