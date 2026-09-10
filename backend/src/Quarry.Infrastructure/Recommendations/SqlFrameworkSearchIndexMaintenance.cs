using Microsoft.EntityFrameworkCore;
using Quarry.Application.Recommendations;
using Quarry.Infrastructure.Persistence;

namespace Quarry.Infrastructure.Recommendations;

public sealed class SqlFrameworkSearchIndexMaintenance : IFrameworkSearchIndexMaintenance
{
    private readonly QuarryDbContext _dbContext;

    public SqlFrameworkSearchIndexMaintenance(QuarryDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task RebuildAsync(CancellationToken cancellationToken)
    {
        await _dbContext.FrameworkVectors.ExecuteDeleteAsync(cancellationToken);
    }
}
