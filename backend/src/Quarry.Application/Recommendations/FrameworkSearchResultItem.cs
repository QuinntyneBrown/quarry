namespace Quarry.Application.Recommendations;

public sealed record FrameworkSearchResultItem(
    Guid Id,
    string Name,
    string Description,
    string Technology,
    IReadOnlyList<string> Tags,
    int ComponentCount,
    string Revision,
    int Rank,
    string Explanation,
    IReadOnlyList<string> SupportingCapabilityIds);
