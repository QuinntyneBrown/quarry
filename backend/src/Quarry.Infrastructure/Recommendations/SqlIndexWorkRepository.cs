using Microsoft.EntityFrameworkCore;
using Quarry.Infrastructure.Persistence;

namespace Quarry.Infrastructure.Recommendations;

public sealed class SqlIndexWorkRepository
{
    private readonly QuarryDbContext _database;

    public SqlIndexWorkRepository(QuarryDbContext database)
    {
        _database = database;
    }

    public async Task EnqueueMissingAsync(string model, CancellationToken cancellationToken)
    {
        await using var transaction = await _database.Database.BeginTransactionAsync(cancellationToken);
        await EnqueueInTransactionAsync(model, cancellationToken);
        await transaction.CommitAsync(cancellationToken);
    }

    public async Task EnqueueInTransactionAsync(string model, CancellationToken cancellationToken)
    {
        if (_database.Database.CurrentTransaction is null)
        {
            throw new InvalidOperationException("Index scheduling requires a transaction.");
        }
        await _database.Database.ExecuteSqlRawAsync("""
            DECLARE @result int;
            EXEC @result = sp_getapplock @Resource = 'Quarry.IndexScheduling', @LockMode = 'Exclusive', @LockOwner = 'Transaction', @LockTimeout = 5000;
            IF @result < 0 THROW 51000, 'Index scheduling lock unavailable', 1;
            """, cancellationToken);
        await _database.Database.ExecuteSqlInterpolatedAsync($"""
            UPDATE w SET State = 'pending', AttemptCount = 0, NextAttemptAtUtc = SYSDATETIMEOFFSET(),
                LeaseId = NULL, LeaseExpiresAtUtc = NULL, LastError = NULL
            FROM IndexWorkItems w JOIN FrameworkRevisions f ON f.Id = w.FrameworkId AND f.Revision = w.SourceRevision
            WHERE f.IsPublished = 1 AND w.Model = {model} AND w.State IN ('completed', 'superseded')
                AND NOT EXISTS (SELECT 1 FROM FrameworkVectors v WHERE v.FrameworkId = f.Id AND v.SourceRevision = f.Revision AND v.Model = {model});

            INSERT INTO IndexWorkItems (Id, FrameworkId, SourceRevision, Model, State, AttemptCount, NextAttemptAtUtc, CreatedAtUtc)
            SELECT NEWID(), f.Id, f.Revision, {model}, 'pending', 0, SYSDATETIMEOFFSET(), SYSDATETIMEOFFSET()
            FROM FrameworkRevisions f WHERE f.IsPublished = 1
                AND NOT EXISTS (SELECT 1 FROM FrameworkVectors v WHERE v.FrameworkId = f.Id AND v.SourceRevision = f.Revision AND v.Model = {model})
                AND NOT EXISTS (SELECT 1 FROM IndexWorkItems w WHERE w.FrameworkId = f.Id AND w.SourceRevision = f.Revision AND w.Model = {model});
            """, cancellationToken);
    }
}
