namespace Quarry.Application.Recommendations;

public interface IFrameworkVectorRepository
{
    Task<VectorSearchSnapshot> GetSnapshotAsync(string? technology, string model, int dimensions, CancellationToken cancellationToken);
    Task<bool> IsCurrentAsync(string catalogRevision, CancellationToken cancellationToken);
}
