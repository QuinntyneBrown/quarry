using Quarry.Application.Recommendations;

namespace Quarry.Api.AcceptanceTests;

public sealed class RecordingSearchIndexMaintenance : IFrameworkSearchIndexMaintenance
{
    public int RebuildCount { get; private set; }

    public Task RebuildAsync(string actorId, string correlationId, CancellationToken cancellationToken)
    {
        RebuildCount++;
        return Task.CompletedTask;
    }
}
