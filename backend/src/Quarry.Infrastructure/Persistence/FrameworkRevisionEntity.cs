namespace Quarry.Infrastructure.Persistence;

public sealed class FrameworkRevisionEntity
{
    public Guid Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public string Technology { get; set; } = string.Empty;

    public string TagsJson { get; set; } = "[]";

    public string CapabilitiesJson { get; set; } = "[]";

    public string UseCasesJson { get; set; } = "[]";

    public string ComponentsJson { get; set; } = "[]";

    public string? PreviewJson { get; set; }

    public int ComponentCount { get; set; }

    public string Revision { get; set; } = "0";

    public bool IsPublished { get; set; }
}
