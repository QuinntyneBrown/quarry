using System.Security.Cryptography;
using System.Text.Json;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Quarry.Domain.Catalog;
using Quarry.Infrastructure.Persistence;
using Quarry.Infrastructure.Recommendations;

namespace Quarry.Infrastructure.Evaluation;

public sealed class SqlEvaluationCatalogSeeder(QuarryDbContext database)
{
    public async Task<bool> SeedAsync(string catalogPath, string actor, string model, CancellationToken cancellationToken)
    {
        var databaseName = new SqlConnectionStringBuilder(database.Database.GetConnectionString()).InitialCatalog;
        if (!databaseName.EndsWith("_Evaluation", StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException("Evaluation seeding requires a dedicated database ending in _Evaluation.");
        var bytes = await File.ReadAllBytesAsync(catalogPath, cancellationToken);
        var entries = JsonSerializer.Deserialize<EvaluationFramework[]>(bytes, JsonSerializerOptions.Web)
            ?? throw new InvalidDataException("Evaluation catalog is missing.");
        if (entries.Length != 8 || entries.Select(item => item.Id).Distinct().Count() != entries.Length
            || entries.Any(item => item.Metadata.Name?.EndsWith("(evaluation)", StringComparison.Ordinal) != true))
            throw new InvalidDataException("Use the eight labeled evaluation fixtures.");
        var frameworks = entries.Select(entry => Framework.CreateDraft(entry.Id, entry.Metadata)).ToArray();
        var fingerprint = Convert.ToHexString(SHA256.HashData(bytes));
        await using var transaction = await database.Database.BeginTransactionAsync(cancellationToken);
        var catalog = await database.CatalogState.FromSqlRaw("SELECT * FROM CatalogState WITH (UPDLOCK, HOLDLOCK) WHERE Id = 1").SingleAsync(cancellationToken);
        var existingIds = await database.FrameworkRevisions.Select(item => item.Id).ToListAsync(cancellationToken);
        if (existingIds.Count != 0 || await database.FrameworkDrafts.AnyAsync(cancellationToken))
        {
            if (existingIds.Count == entries.Length && existingIds.ToHashSet().SetEquals(entries.Select(entry => entry.Id))
                && await database.MaintenanceAuditRecords.AnyAsync(item => item.Operation == "evaluation-seed" && item.CorrelationId == fingerprint, cancellationToken))
                return false;
            throw new InvalidOperationException("Evaluation seeding will not overwrite an existing catalog.");
        }
        var now = DateTimeOffset.UtcNow;
        foreach (var framework in frameworks)
        {
            var metadata = framework.Metadata;
            var metadataJson = JsonSerializer.Serialize(metadata);
            database.FrameworkDrafts.Add(new FrameworkDraftEntity { Id = framework.Id, Revision = "1", MetadataJson = metadataJson });
            database.FrameworkRevisions.Add(new FrameworkRevisionEntity
            {
                Id = framework.Id, Name = metadata.Name!, Description = metadata.Description!, Technology = metadata.Technology!,
                Revision = "1", IsPublished = true, ComponentCount = framework.ComponentCount,
                TagsJson = JsonSerializer.Serialize(metadata.Tags), CapabilitiesJson = JsonSerializer.Serialize(metadata.Capabilities),
                ComponentsJson = JsonSerializer.Serialize(metadata.Components), UseCasesJson = JsonSerializer.Serialize(metadata.UseCases)
            });
            database.PublishedFrameworkSnapshots.Add(new PublishedFrameworkSnapshotEntity
            {
                FrameworkId = framework.Id, Revision = "1", MetadataJson = metadataJson, PublishedBy = actor, PublishedAtUtc = now,
                EvidenceJson = JsonSerializer.Serialize(new { kind = "illustrative-evaluation-fixture", source = "backend/evaluation/catalog.json", sha256 = fingerprint })
            });
        }
        catalog.Revision = checked(catalog.Revision + 1);
        database.MaintenanceAuditRecords.Add(new MaintenanceAuditRecordEntity
        {
            Id = Guid.NewGuid(), ActorId = actor, Operation = "evaluation-seed", Outcome = "accepted",
            CorrelationId = fingerprint, RecordedAtUtc = now
        });
        await database.SaveChangesAsync(cancellationToken);
        await new SqlIndexWorkRepository(database).EnqueueInTransactionAsync(model, cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        return true;
    }
}
