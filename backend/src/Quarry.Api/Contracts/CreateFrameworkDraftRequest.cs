using Quarry.Domain.Catalog;

namespace Quarry.Api.Contracts;

public sealed record CreateFrameworkDraftRequest(Guid Id, string? Name, string? Description, string? Technology,
    IReadOnlyList<string?>? Tags, IReadOnlyList<FrameworkCapabilityMetadata?>? Capabilities,
    IReadOnlyList<string?>? UseCases, IReadOnlyList<FrameworkComponentMetadata?>? Components, FrameworkPreviewDefinition? Preview = null,
    string? DesignSystemUri = null);
