namespace Quarry.Application.Operations;

public sealed record FrameworkIndexHealth(Guid FrameworkId, string SourceRevision, string? IndexedRevision,
    bool IsSearchable, double? PendingAgeSeconds);
