using Microsoft.EntityFrameworkCore;
using Quarry.Application.Recommendations;
using Quarry.Infrastructure.Persistence;
using Quarry.Infrastructure.Recommendations;

namespace Quarry.Api.AcceptanceTests;

internal sealed class InterleavingVectorRepository(QuarryDbContext database, Func<Task> afterRead) : IFrameworkVectorRepository
{
    public async Task<VectorSearchSnapshot> GetSnapshotAsync(string? technology, string model, int dimensions, CancellationToken cancellationToken)
    {
        var snapshot = await new SqlFrameworkVectorRepository(database).GetSnapshotAsync(technology, model, dimensions, cancellationToken);
        await afterRead();
        return snapshot;
    }

    public async Task<bool> IsCurrentAsync(string catalogRevision, CancellationToken cancellationToken)
        => (await database.CatalogState.AsNoTracking().SingleAsync(cancellationToken)).Revision.ToString(System.Globalization.CultureInfo.InvariantCulture) == catalogRevision;
}
