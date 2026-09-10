using Microsoft.EntityFrameworkCore;
using Quarry.Infrastructure.Persistence;
using Quarry.Application.Recommendations;
using System.Data;
using System.Text.Json;

namespace Quarry.Infrastructure.Recommendations;

public sealed class SqlIndexWorkRepository
{
    public async Task<IndexWorkItemEntity?> ClaimAsync(string model, CancellationToken cancellationToken)
    {
        var leaseId = Guid.NewGuid();
        var claims = await _database.IndexWorkItems.FromSqlInterpolated($"""
            ;WITH candidate AS (
                SELECT TOP (1) * FROM IndexWorkItems WITH (UPDLOCK, READPAST, ROWLOCK)
                WHERE Model = {model} AND ((State = 'pending' AND NextAttemptAtUtc <= SYSDATETIMEOFFSET())
                    OR (State = 'leased' AND LeaseExpiresAtUtc <= SYSDATETIMEOFFSET()))
                ORDER BY NextAttemptAtUtc, Id
            )
            UPDATE candidate SET State = 'leased', LeaseId = {leaseId},
                LeaseExpiresAtUtc = DATEADD(second, 30, SYSDATETIMEOFFSET()), AttemptCount = AttemptCount + 1
            OUTPUT inserted.*;
            """).AsNoTracking().ToListAsync(cancellationToken);
        return claims.SingleOrDefault();
    }

    public async Task<bool> CompleteAsync(IndexWorkItemEntity lease, TextEmbedding embedding, CancellationToken cancellationToken)
    {
        if (embedding.Values.Count == 0 || embedding.Values.Any(value => !float.IsFinite(value)) || !embedding.Values.Any(value => value != 0))
        {
            throw new InvalidDataException("Embedding contains no usable vector.");
        }
        await using var transaction = await _database.Database.BeginTransactionAsync(IsolationLevel.Serializable, cancellationToken);
        var work = await _database.IndexWorkItems.FromSqlInterpolated($"""
            SELECT * FROM IndexWorkItems WITH (UPDLOCK, HOLDLOCK)
            WHERE Id = {lease.Id} AND LeaseId = {lease.LeaseId} AND State = 'leased' AND LeaseExpiresAtUtc > SYSDATETIMEOFFSET()
            """).AsNoTracking().SingleOrDefaultAsync(cancellationToken);
        if (work is null) return false;
        var framework = await _database.FrameworkRevisions.FromSqlInterpolated($"""
            SELECT * FROM FrameworkRevisions WITH (UPDLOCK, HOLDLOCK) WHERE Id = {work.FrameworkId}
            """).AsNoTracking().SingleOrDefaultAsync(cancellationToken);
        var current = framework is not null && framework.IsPublished && framework.Revision == work.SourceRevision && embedding.Model == work.Model;
        if (current)
        {
            await _database.Database.ExecuteSqlInterpolatedAsync($"""
                DELETE FROM FrameworkVectors WHERE FrameworkId = {work.FrameworkId};
                INSERT INTO FrameworkVectors (FrameworkId, SourceRevision, Model, Dimensions, ValuesJson, IndexedAtUtc)
                VALUES ({work.FrameworkId}, {work.SourceRevision}, {work.Model}, {embedding.Values.Count}, {JsonSerializer.Serialize(embedding.Values)}, SYSDATETIMEOFFSET());
                """, cancellationToken);
        }
        await _database.IndexWorkItems.Where(item => item.Id == work.Id).ExecuteUpdateAsync(setters => setters
            .SetProperty(item => item.State, current ? "completed" : "superseded")
            .SetProperty(item => item.LeaseId, (Guid?)null)
            .SetProperty(item => item.LeaseExpiresAtUtc, (DateTimeOffset?)null)
            .SetProperty(item => item.LastError, (string?)null), cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        return current;
    }

    public async Task FailAsync(IndexWorkItemEntity lease, string category, CancellationToken cancellationToken)
    {
        await _database.Database.ExecuteSqlInterpolatedAsync($"""
            UPDATE IndexWorkItems SET State = 'pending', LeaseId = NULL, LeaseExpiresAtUtc = NULL, LastError = {category},
                NextAttemptAtUtc = DATEADD(second, CASE WHEN AttemptCount >= 6 THEN 30 ELSE POWER(2, AttemptCount - 1) END, SYSDATETIMEOFFSET())
            WHERE Id = {lease.Id} AND LeaseId = {lease.LeaseId} AND State = 'leased' AND LeaseExpiresAtUtc > SYSDATETIMEOFFSET();
            """, cancellationToken);
    }

    public async Task SupersedeAsync(IndexWorkItemEntity lease, CancellationToken cancellationToken)
    {
        await _database.IndexWorkItems.Where(item => item.Id == lease.Id && item.LeaseId == lease.LeaseId && item.State == "leased")
            .ExecuteUpdateAsync(setters => setters.SetProperty(item => item.State, "superseded")
                .SetProperty(item => item.LeaseId, (Guid?)null).SetProperty(item => item.LeaseExpiresAtUtc, (DateTimeOffset?)null), cancellationToken);
    }

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
