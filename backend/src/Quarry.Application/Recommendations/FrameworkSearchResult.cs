namespace Quarry.Application.Recommendations;

public sealed record FrameworkSearchResult(
    IReadOnlyList<FrameworkSearchResultItem> Items,
    string CatalogRevision,
    bool IsIndexIncomplete);
