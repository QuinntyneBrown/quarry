namespace Quarry.Application.Recommendations;

public interface IFrameworkSearchIndexMaintenance
{
    Task RebuildAsync(string actorId, string correlationId, CancellationToken cancellationToken);
}
