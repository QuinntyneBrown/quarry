using System.Text.Json;
using System.Data;
using System.Globalization;
using Microsoft.EntityFrameworkCore;
using Quarry.Application.Recommendations;
using Quarry.Application.Catalog;
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
        await using var transaction = await _dbContext.Database.BeginTransactionAsync(IsolationLevel.Serializable, cancellationToken);
        var catalogRevision = await _dbContext.CatalogState.AsNoTracking().Where(item => item.Id == 1)
            .Select(item => item.Revision).SingleAsync(cancellationToken);
        var frameworks = _dbContext.FrameworkRevisions.AsNoTracking().Where(item => item.IsPublished);
        if (!string.IsNullOrWhiteSpace(technology))
        {
            frameworks = frameworks.Where(item => item.Technology == technology);
        }

        var eligibleCount = await frameworks.CountAsync(cancellationToken);
        var rows = await (from framework in frameworks
                          join vector in _dbContext.FrameworkVectors.AsNoTracking() on framework.Id equals vector.FrameworkId
                          where vector.SourceRevision == framework.Revision && vector.Model == model && vector.Dimensions == dimensions
                          select new
                          {
                              framework.Id, framework.Name, framework.Description, framework.Technology, framework.TagsJson,
                              framework.ComponentCount, framework.Revision, framework.CapabilitiesJson, vector.ValuesJson
                          }).ToListAsync(cancellationToken);
        var candidates = new List<FrameworkVectorCandidate>();
        var metadata = new Dictionary<Guid, FrameworkSearchMetadata>();
        foreach (var row in rows)
        {
            var values = StoredEmbeddingVector.Read(row.ValuesJson, dimensions);
            if (values is null) continue;
            candidates.Add(new FrameworkVectorCandidate(row.Id, row.Technology, values));
            metadata.Add(row.Id, new FrameworkSearchMetadata(
                new FrameworkSummary(row.Id, row.Name, row.Description, row.Technology,
                    JsonSerializer.Deserialize<List<string>>(row.TagsJson) ?? [], row.ComponentCount, row.Revision),
                JsonSerializer.Deserialize<List<FrameworkCapability>>(row.CapabilitiesJson) ?? []));
        }
        await transaction.CommitAsync(cancellationToken);
        return new VectorSearchSnapshot(candidates, candidates.Count != eligibleCount,
            catalogRevision.ToString(CultureInfo.InvariantCulture), metadata);
    }

    public async Task<bool> IsCurrentAsync(string catalogRevision, CancellationToken cancellationToken)
    {
        var current = await _dbContext.CatalogState.AsNoTracking().Where(item => item.Id == 1)
            .Select(item => item.Revision).SingleAsync(cancellationToken);
        return current.ToString(CultureInfo.InvariantCulture) == catalogRevision;
    }
}
