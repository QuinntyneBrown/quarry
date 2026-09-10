namespace Quarry.Infrastructure.Persistence;

public sealed class IndexWorkItemEntity
{
    public Guid Id { get; set; }
    public Guid FrameworkId { get; set; }
    public string SourceRevision { get; set; } = string.Empty;
    public string Model { get; set; } = string.Empty;
    public string State { get; set; } = "pending";
    public int AttemptCount { get; set; }
    public Guid? LeaseId { get; set; }
    public DateTimeOffset? LeaseExpiresAtUtc { get; set; }
    public DateTimeOffset NextAttemptAtUtc { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; }
    public string? LastError { get; set; }
}
