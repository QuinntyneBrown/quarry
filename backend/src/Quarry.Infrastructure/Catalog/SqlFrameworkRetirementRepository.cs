using System.Globalization;
using Microsoft.EntityFrameworkCore;
using Quarry.Application.Catalog;
using Quarry.Domain.Catalog;
using Quarry.Infrastructure.Persistence;

namespace Quarry.Infrastructure.Catalog;

public sealed class SqlFrameworkRetirementRepository(QuarryDbContext database) : IFrameworkRetirementRepository
{
    public async Task<FrameworkRetirementResult> RetireAsync(Guid id, string expectedRevision, FrameworkRetirementKind kind,
        string actorId, string correlationId, CancellationToken cancellationToken)
    {
        await using var transaction = await database.Database.BeginTransactionAsync(cancellationToken);
        var lockName = $"Quarry.Framework.{id:D}";
        await database.Database.ExecuteSqlInterpolatedAsync($"""
            DECLARE @result int;
            EXEC @result = sp_getapplock @Resource = {lockName}, @LockMode = 'Exclusive', @LockOwner = 'Transaction', @LockTimeout = 5000;
            IF @result < 0 THROW 51000, 'Framework maintenance lock unavailable', 1;
            """, cancellationToken);
        var draft = await database.FrameworkDrafts.SingleOrDefaultAsync(item => item.Id == id && !item.IsDeleted, cancellationToken);
        if (draft is null) return new(FrameworkRetirementStatus.NotFound);
        if (draft.Revision != expectedRevision) return new(FrameworkRetirementStatus.Conflict);
        var catalog = await database.CatalogState.FromSqlRaw("SELECT * FROM CatalogState WITH (UPDLOCK, HOLDLOCK) WHERE Id = 1").SingleAsync(cancellationToken);
        var published = await database.FrameworkRevisions.SingleOrDefaultAsync(item => item.Id == id, cancellationToken);
        if (kind == FrameworkRetirementKind.Withdraw && published is not { IsPublished: true })
            return new(FrameworkRetirementStatus.Conflict);
        draft.Revision = Framework.NextRevision(expectedRevision);
        draft.IsDeleted = kind == FrameworkRetirementKind.Delete;
        if (published is { IsPublished: true })
        {
            published.IsPublished = false;
            catalog.Revision = checked(catalog.Revision + 1);
        }
        database.MaintenanceAuditRecords.Add(new MaintenanceAuditRecordEntity
        {
            Id = Guid.NewGuid(), TargetId = id, SourceRevision = draft.Revision, ActorId = actorId,
            Operation = kind == FrameworkRetirementKind.Delete ? "framework-delete" : "framework-withdraw",
            Outcome = "accepted", CorrelationId = correlationId, RecordedAtUtc = DateTimeOffset.UtcNow
        });
        // Existing vectors and work remain historical; readers and completion check current publication eligibility.
        await database.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        return new(FrameworkRetirementStatus.Accepted, draft.Revision, catalog.Revision.ToString(CultureInfo.InvariantCulture));
    }
}
