namespace Quarry.Domain.Catalog;

public sealed record FrameworkPreviewDefinition(string? PreviewUri, IReadOnlyList<string?>? ComponentIds,
    string? BuildId, int ProtocolVersion, bool? IsIllustrative)
{
    public bool IsValid(IReadOnlyList<FrameworkComponentMetadata?>? components)
    {
        if (BuildId is not { Length: > 0 and <= 64 } || BuildId.Any(character => character is not (>= 'a' and <= 'z' or >= '0' and <= '9' or '-'))
            || ProtocolVersion != 1 || IsIllustrative is null
            || ComponentIds is not { Count: > 0 and <= 200 }
            || ComponentIds.Distinct(StringComparer.Ordinal).Count() != ComponentIds.Count
            || ComponentIds.Any(id => string.IsNullOrWhiteSpace(id) || components?.Any(component => component?.Id?.Trim() == id) != true)
            || PreviewUri is not { Length: > 0 and <= 2000 }
            || !Uri.TryCreate(PreviewUri, UriKind.Absolute, out var uri)) return false;
        return (uri.Scheme == "https" || uri.Scheme == "http" && uri.Host is "localhost" or "127.0.0.1" or "[::1]")
            && uri.UserInfo.Length == 0 && uri.Query.Length == 0 && uri.Fragment.Length == 0
            && uri.AbsolutePath == $"/bundles/{BuildId}/index.html";
    }

    public FrameworkPreviewDefinition Snapshot() => this with { ComponentIds = Array.AsReadOnly(ComponentIds!.ToArray()) };
}
