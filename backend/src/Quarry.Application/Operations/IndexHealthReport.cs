namespace Quarry.Application.Operations;

public sealed record IndexHealthReport(int PublishedCount, int SearchableCount, int PendingCount, int FailureCount,
    double? OldestPendingAgeSeconds, bool FreshnessTargetBreached, IReadOnlyList<FrameworkIndexHealth> Revisions);
