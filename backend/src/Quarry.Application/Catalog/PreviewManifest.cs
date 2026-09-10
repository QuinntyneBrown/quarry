namespace Quarry.Application.Catalog;

public sealed record PreviewManifest(Guid FrameworkId, string Revision, string PreviewUri,
    IReadOnlyList<string> ComponentIds, string BuildId, int ProtocolVersion, bool IsIllustrative);
