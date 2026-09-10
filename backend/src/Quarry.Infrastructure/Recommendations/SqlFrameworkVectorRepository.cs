using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Quarry.Application.Recommendations;
using Quarry.Infrastructure.Persistence;

namespace Quarry.Infrastructure.Recommendations;

public sealed class SqlFrameworkVectorRepository : IFrameworkVectorRepository
{
    private readonly QuarryDbContext _dbContext;

    public SqlFrameworkVectorRepository(QuarryDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<VectorSearchSnapshot> GetSnapshotAsync(string? technology, string model, int dimensions, CancellationToken cancellationToken)
    {
        var frameworks = _dbContext.FrameworkRevisions.AsNoTracking().Where(item => item.IsPublished);
        if (!string.IsNullOrWhiteSpace(technology))
        {
            frameworks = frameworks.Where(item => item.Technology == technology);
        }

        var eligibleCount = await frameworks.CountAsync(cancellationToken);
        var rows = await (from framework in frameworks
                          join vector in _dbContext.FrameworkVectors.AsNoTracking() on framework.Id equals vector.FrameworkId
                          where vector.SourceRevision == framework.Revision && vector.Model == model && vector.Dimensions == dimensions
                          select new { framework.Id, framework.Technology, vector.ValuesJson }).ToListAsync(cancellationToken);
        var candidates = rows.Select(row => new FrameworkVectorCandidate(
            row.Id,
            row.Technology,
            JsonSerializer.Deserialize<List<float>>(row.ValuesJson) ?? [])).ToList();
        return new VectorSearchSnapshot(candidates, candidates.Count != eligibleCount);
    }
}
