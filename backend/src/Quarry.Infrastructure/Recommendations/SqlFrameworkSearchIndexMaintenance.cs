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

    public async Task RebuildAsync(string actorId, string correlationId, CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(actorId);
        await using var transaction = await _dbContext.Database.BeginTransactionAsync(cancellationToken);
        var invalidatedCount = await _dbContext.FrameworkVectors.ExecuteDeleteAsync(cancellationToken);
        _dbContext.MaintenanceAuditRecords.Add(new MaintenanceAuditRecordEntity
        {
            Id = Guid.NewGuid(),
            ActorId = actorId,
            Operation = "search-index-rebuild",
            Outcome = "accepted",
            CorrelationId = correlationId,
            InvalidatedVectorCount = invalidatedCount,
            RecordedAtUtc = DateTimeOffset.UtcNow
        });
        await _dbContext.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
    }
}
