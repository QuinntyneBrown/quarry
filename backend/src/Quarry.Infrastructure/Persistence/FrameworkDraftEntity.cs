namespace Quarry.Infrastructure.Persistence;

public sealed class FrameworkDraftEntity
{
    public Guid Id { get; set; }
    public string Revision { get; set; } = "1";
    public bool IsDeleted { get; set; }
    public string MetadataJson { get; set; } = string.Empty;
}
