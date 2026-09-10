using System.Globalization;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Quarry.Application.Catalog;
using Quarry.Domain.Catalog;
using Quarry.Infrastructure.Persistence;
using Quarry.Infrastructure.Recommendations;

namespace Quarry.Infrastructure.Catalog;

public sealed class SqlFrameworkPublicationRepository : IFrameworkPublicationRepository
{
    private readonly QuarryDbContext _database;
    private readonly SqlIndexWorkRepository _work;
    private readonly string _model;

    public SqlFrameworkPublicationRepository(QuarryDbContext database, SqlIndexWorkRepository work, IOptions<OllamaEmbeddingOptions> options)
    {
        _database = database; _work = work; _model = options.Value.CompatibilityKey;
    }

    public async Task<PublicationResult> PublishAsync(Guid id, string expectedRevision, IReadOnlyList<PublicationEvidence?>? evidence,
        string actorId, string correlationId, CancellationToken cancellationToken)
    {
        await using var transaction = await _database.Database.BeginTransactionAsync(cancellationToken);
        var lockName = $"Quarry.Framework.{id:D}";
        await _database.Database.ExecuteSqlInterpolatedAsync($"""
            DECLARE @result int;
            EXEC @result = sp_getapplock @Resource = {lockName}, @LockMode = 'Exclusive', @LockOwner = 'Transaction', @LockTimeout = 5000;
            IF @result < 0 THROW 51000, 'Framework maintenance lock unavailable', 1;
            """, cancellationToken);
        var draft = await _database.FrameworkDrafts.SingleOrDefaultAsync(item => item.Id == id && !item.IsDeleted, cancellationToken);
        if (draft is null) return new PublicationResult(PublicationStatus.NotFound, id);
        if (draft.Revision != expectedRevision) return new PublicationResult(PublicationStatus.Conflict, id);
        var framework = Framework.ReviseDraft(id, draft.Revision, JsonSerializer.Deserialize<FrameworkMetadata>(draft.MetadataJson)!);
        var validatedEvidence = framework.ValidatePublicationEvidence(evidence);
        var catalog = await _database.CatalogState.FromSqlRaw("SELECT * FROM CatalogState WITH (UPDLOCK, HOLDLOCK) WHERE Id = 1").SingleAsync(cancellationToken);
        catalog.Revision = checked(catalog.Revision + 1);
        var published = await _database.FrameworkRevisions.SingleOrDefaultAsync(item => item.Id == id, cancellationToken);
        if (published is null)
        {
            published = new FrameworkRevisionEntity { Id = id };
            _database.FrameworkRevisions.Add(published);
        }
        published.Name = framework.Metadata.Name!;
        published.Description = framework.Metadata.Description!;
        published.Technology = framework.Metadata.Technology!;
        published.TagsJson = JsonSerializer.Serialize(framework.Metadata.Tags);
        published.CapabilitiesJson = JsonSerializer.Serialize(framework.Metadata.Capabilities);
        published.UseCasesJson = JsonSerializer.Serialize(framework.Metadata.UseCases);
        published.ComponentsJson = JsonSerializer.Serialize(framework.Metadata.Components);
        published.ComponentCount = framework.ComponentCount;
        published.Revision = framework.Revision;
        published.IsPublished = true;
        draft.Revision = framework.Revision;
        _database.PublishedFrameworkSnapshots.Add(new PublishedFrameworkSnapshotEntity
        {
            FrameworkId = id, Revision = framework.Revision, MetadataJson = JsonSerializer.Serialize(framework.Metadata),
            EvidenceJson = JsonSerializer.Serialize(validatedEvidence), PublishedBy = actorId, PublishedAtUtc = DateTimeOffset.UtcNow
        });
        _database.MaintenanceAuditRecords.Add(new MaintenanceAuditRecordEntity
        {
            Id = Guid.NewGuid(), TargetId = id, SourceRevision = framework.Revision, ActorId = actorId,
            Operation = "framework-publish", Outcome = "accepted", CorrelationId = correlationId, RecordedAtUtc = DateTimeOffset.UtcNow
        });
        await _database.SaveChangesAsync(cancellationToken);
        await _work.EnqueueInTransactionAsync(_model, cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        return new PublicationResult(PublicationStatus.Published, id, framework.Revision, catalog.Revision.ToString(CultureInfo.InvariantCulture));
    }
}
