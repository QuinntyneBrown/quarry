namespace Quarry.Domain.Catalog;

public sealed record FrameworkMetadata(
    string? Name, string? Description, string? Technology, IReadOnlyList<string?>? Tags,
    IReadOnlyList<FrameworkCapabilityMetadata?>? Capabilities, IReadOnlyList<string?>? UseCases,
    IReadOnlyList<FrameworkComponentMetadata?>? Components, FrameworkPreviewDefinition? Preview = null,
    string? DesignSystemUri = null);
