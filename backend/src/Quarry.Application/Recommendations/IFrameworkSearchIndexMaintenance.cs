namespace Quarry.Application.Recommendations;

public interface IFrameworkSearchIndexMaintenance
{
    Task RebuildAsync(CancellationToken cancellationToken);
}
