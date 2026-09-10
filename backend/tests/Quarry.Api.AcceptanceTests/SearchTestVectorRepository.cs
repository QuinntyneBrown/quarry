using Quarry.Application.Recommendations;

namespace Quarry.Api.AcceptanceTests;

internal sealed class SearchTestVectorRepository : IFrameworkVectorRepository
{
    public Task<VectorSearchSnapshot> GetSnapshotAsync(string? technology, string model, int dimensions, CancellationToken cancellationToken)
    {
        return Task.FromResult(new VectorSearchSnapshot([new FrameworkVectorCandidate(Guid.Parse("3a23bcd2-2b42-492d-a95e-1dd1e3e3cc3f"), "React", [1f, 0f])], true));
    }
}
