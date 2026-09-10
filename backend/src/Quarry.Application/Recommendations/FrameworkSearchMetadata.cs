using Quarry.Application.Catalog;

namespace Quarry.Application.Recommendations;

public sealed record FrameworkSearchMetadata(FrameworkSummary Summary, IReadOnlyList<FrameworkCapability> Capabilities);
