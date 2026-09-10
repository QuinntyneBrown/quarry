using Quarry.Application.Recommendations;

namespace Quarry.Api.AcceptanceTests;

internal sealed class SearchTestVectorRepository : IFrameworkVectorRepository
{
    public async Task<VectorSearchSnapshot> GetSnapshotAsync(string? technology, string model, int dimensions, CancellationToken cancellationToken)
    {
        var id = Guid.Parse("3a23bcd2-2b42-492d-a95e-1dd1e3e3cc3f");
        var details = (await new SearchTestDetailsReader().GetAsync(id, cancellationToken))!;
        return new VectorSearchSnapshot([new FrameworkVectorCandidate(id, "React", [1f, 0f])], true, "10",
            new Dictionary<Guid, FrameworkSearchMetadata> { [id] = new(details.Summary, details.Capabilities) });
    }

    public Task<bool> IsCurrentAsync(string catalogRevision, CancellationToken cancellationToken) => Task.FromResult(true);
}
