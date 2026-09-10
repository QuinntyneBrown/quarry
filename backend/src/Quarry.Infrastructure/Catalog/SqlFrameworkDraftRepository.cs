using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Quarry.Application.Catalog;
using Quarry.Domain.Catalog;
using Quarry.Infrastructure.Persistence;

namespace Quarry.Infrastructure.Catalog;

public sealed class SqlFrameworkDraftRepository : IFrameworkDraftRepository
{
    private readonly QuarryDbContext _database;
    public SqlFrameworkDraftRepository(QuarryDbContext database) => _database = database;

    public async Task<bool> CreateAsync(Framework framework, string actorId, string correlationId, CancellationToken cancellationToken)
    {
        await using var transaction = await _database.Database.BeginTransactionAsync(cancellationToken);
        await LockFrameworkAsync(framework.Id, cancellationToken);
        if (await _database.FrameworkDrafts.AnyAsync(item => item.Id == framework.Id, cancellationToken)
            || await _database.FrameworkRevisions.AnyAsync(item => item.Id == framework.Id, cancellationToken)) return false;
        _database.FrameworkDrafts.Add(new FrameworkDraftEntity
        {
            Id = framework.Id, Revision = framework.Revision, MetadataJson = JsonSerializer.Serialize(framework.Metadata)
        });
        _database.MaintenanceAuditRecords.Add(new MaintenanceAuditRecordEntity
        {
            Id = Guid.NewGuid(), ActorId = actorId, Operation = "framework-create", Outcome = "accepted",
            CorrelationId = correlationId, TargetId = framework.Id, SourceRevision = framework.Revision, RecordedAtUtc = DateTimeOffset.UtcNow
        });
        await _database.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        return true;
    }

    public async Task<FrameworkDraft?> GetAsync(Guid id, CancellationToken cancellationToken)
    {
        var stored = await _database.FrameworkDrafts.AsNoTracking().SingleOrDefaultAsync(item => item.Id == id, cancellationToken);
        if (stored is null) return null;
        var metadata = JsonSerializer.Deserialize<FrameworkMetadata>(stored.MetadataJson)!;
        return new FrameworkDraft(stored.Id, stored.Revision, "draft", metadata.Components!.Count, metadata);
    }

    public async Task<DraftUpdateStatus> UpdateAsync(Framework framework, string expectedRevision, string actorId, string correlationId, CancellationToken cancellationToken)
    {
        await using var transaction = await _database.Database.BeginTransactionAsync(cancellationToken);
        await LockFrameworkAsync(framework.Id, cancellationToken);
        var draft = await _database.FrameworkDrafts.SingleOrDefaultAsync(item => item.Id == framework.Id, cancellationToken);
        if (draft is null) return DraftUpdateStatus.NotFound;
        if (draft.Revision != expectedRevision) return DraftUpdateStatus.Conflict;
        draft.MetadataJson = JsonSerializer.Serialize(framework.Metadata);
        draft.Revision = framework.Revision;
        _database.MaintenanceAuditRecords.Add(new MaintenanceAuditRecordEntity
        {
            Id = Guid.NewGuid(), ActorId = actorId, Operation = "framework-update", Outcome = "accepted",
            CorrelationId = correlationId, TargetId = framework.Id, SourceRevision = framework.Revision, RecordedAtUtc = DateTimeOffset.UtcNow
        });
        await _database.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        return DraftUpdateStatus.Updated;
    }

    private Task LockFrameworkAsync(Guid id, CancellationToken cancellationToken)
    {
        var lockName = $"Quarry.Framework.{id:D}";
        return _database.Database.ExecuteSqlInterpolatedAsync($"""
            DECLARE @result int;
            EXEC @result = sp_getapplock @Resource = {lockName}, @LockMode = 'Exclusive', @LockOwner = 'Transaction', @LockTimeout = 5000;
            IF @result < 0 THROW 51000, 'Framework maintenance lock unavailable', 1;
            """, cancellationToken);
    }
}
