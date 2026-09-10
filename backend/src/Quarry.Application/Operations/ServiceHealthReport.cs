namespace Quarry.Application.Operations;

public sealed record ServiceHealthReport(string CatalogStatus, string SearchStatus, string IndexingStatus,
    IReadOnlyList<string> Issues, IndexHealthReport? Index);
