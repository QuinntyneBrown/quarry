namespace Quarry.Application.Catalog;

public sealed record FrameworkDetails(
    FrameworkSummary Summary,
    IReadOnlyList<FrameworkCapability> Capabilities,
    IReadOnlyList<string> UseCases,
    IReadOnlyList<FrameworkComponentDescriptor> Components, PreviewManifest? PreviewManifest = null);
