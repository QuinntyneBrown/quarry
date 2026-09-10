namespace Quarry.Infrastructure.Persistence;

public sealed class MaintenanceAuditRecordEntity
{
    public Guid Id { get; set; }

    public string ActorId { get; set; } = string.Empty;

    public string Operation { get; set; } = string.Empty;

    public string Outcome { get; set; } = string.Empty;

    public string CorrelationId { get; set; } = string.Empty;

    public int InvalidatedVectorCount { get; set; }

    public DateTimeOffset RecordedAtUtc { get; set; }
}
