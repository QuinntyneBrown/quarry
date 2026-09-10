namespace Quarry.Infrastructure.Persistence;

public sealed class PublishedFrameworkSnapshotEntity
{
    public Guid FrameworkId { get; set; }
    public string Revision { get; set; } = string.Empty;
    public string MetadataJson { get; set; } = string.Empty;
    public string EvidenceJson { get; set; } = string.Empty;
    public string PublishedBy { get; set; } = string.Empty;
    public DateTimeOffset PublishedAtUtc { get; set; }
}
