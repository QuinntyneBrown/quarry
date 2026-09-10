namespace Quarry.Application.Catalog;

public sealed record FrameworkSummary(
    Guid Id,
    string Name,
    string Description,
    string Technology,
    IReadOnlyList<string> Tags,
    int ComponentCount,
    string Revision);
