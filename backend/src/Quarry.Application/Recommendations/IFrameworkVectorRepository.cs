namespace Quarry.Application.Recommendations;

public interface IFrameworkVectorRepository
{
    Task<VectorSearchSnapshot> GetSnapshotAsync(string? technology, string model, int dimensions, CancellationToken cancellationToken);
}
