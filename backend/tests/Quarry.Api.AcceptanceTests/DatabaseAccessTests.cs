// Acceptance Test
// Traces to: L2-028, L2-030, L2-034, L2-042
// Description: Runtime connection roles separate public reads from maintenance and indexing writes.
using System.Data.Common;
using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Quarry.Infrastructure.Recommendations;
using Quarry.Infrastructure.Catalog;
using Quarry.Infrastructure.Operations;
using Quarry.Domain.Catalog;
using Quarry.Application.Catalog;
using System.Text.Json;

namespace Quarry.Api.AcceptanceTests;

public sealed class DatabaseAccessTests
{
    [SqlServerFact]
    public async Task PublicAndMaintenanceConnectionsFailIndependently()
    {
        await using var fixture = await SqlMaintenanceFixture.CreateAsync();
        await using var database = fixture.CreateContext();
        var connection = database.Database.GetConnectionString();
        using var sourceClient = fixture.CreateClient();
        using var maintenanceFactory = fixture.Factory.WithWebHostBuilder(builder =>
        {
            builder.UseSetting("ConnectionStrings:Quarry", UnavailableCatalogConfiguration.ConnectionString);
            builder.UseSetting("ConnectionStrings:QuarryRead", UnavailableCatalogConfiguration.ConnectionString);
            builder.UseSetting("ConnectionStrings:QuarryMaintenance", connection);
        });
        using var maintenance = maintenanceFactory.CreateClient();
        maintenance.DefaultRequestHeaders.Authorization = sourceClient.DefaultRequestHeaders.Authorization;
        Assert.Equal(HttpStatusCode.Created, (await maintenance.PostAsJsonAsync("/api/maintenance/frameworks", SqlMaintenanceFixture.DraftBody(Guid.NewGuid()))).StatusCode);
        Assert.Equal(HttpStatusCode.ServiceUnavailable, (await maintenance.GetAsync("/api/frameworks")).StatusCode);
        using var readFactory = fixture.Factory.WithWebHostBuilder(builder =>
        {
            builder.UseSetting("ConnectionStrings:Quarry", UnavailableCatalogConfiguration.ConnectionString);
            builder.UseSetting("ConnectionStrings:QuarryRead", connection);
            builder.UseSetting("ConnectionStrings:QuarryMaintenance", UnavailableCatalogConfiguration.ConnectionString);
        });
        using var reader = readFactory.CreateClient();
        reader.DefaultRequestHeaders.Authorization = sourceClient.DefaultRequestHeaders.Authorization;
        Assert.Equal(HttpStatusCode.OK, (await reader.GetAsync("/api/frameworks")).StatusCode);
        Assert.Equal(HttpStatusCode.ServiceUnavailable, (await reader.PostAsJsonAsync("/api/maintenance/frameworks", SqlMaintenanceFixture.DraftBody(Guid.NewGuid()))).StatusCode);
    }

    [SqlServerFact]
    public async Task PublicDatabaseRoleCanReadButCannotWriteOrReadDrafts()
    {
        await using var fixture = await SqlMaintenanceFixture.CreateAsync();
        await using var database = fixture.CreateContext();
        await database.Database.ExecuteSqlRawAsync("CREATE USER QuarryReadTest WITHOUT LOGIN; ALTER ROLE QuarryRead ADD MEMBER QuarryReadTest;");
        await database.Database.OpenConnectionAsync();
        await database.Database.ExecuteSqlRawAsync("EXECUTE AS USER = 'QuarryReadTest';");
        try
        {
            Assert.Empty(await database.FrameworkRevisions.AsNoTracking().ToListAsync());
            Assert.Empty(await database.FrameworkVectors.AsNoTracking().ToListAsync());
            var health = await new SqlServiceHealthReader(database, new IndexingTestEmbeddingProvider(), Options.Create(TestEmbeddingProfile.Options)).GetAsync(CancellationToken.None);
            Assert.Equal("healthy", health.CatalogStatus);
            Assert.Equal("healthy", health.SearchStatus);
            foreach (var statement in new[] { "UPDATE FrameworkRevisions SET Name = Name;", "DELETE FROM FrameworkVectors;", "UPDATE IndexWorkItems SET State = State;", "SELECT * FROM FrameworkDrafts;", "SELECT MetadataJson FROM PublishedFrameworkSnapshots;" })
                await Assert.ThrowsAnyAsync<DbException>(() => database.Database.ExecuteSqlRawAsync(statement));
        }
        finally { await database.Database.ExecuteSqlRawAsync("REVERT;"); }
    }

    [SqlServerFact]
    public async Task WorkerRoleProcessesDurableWorkButCannotMaintainCatalogOrAudit()
    {
        await using var fixture = await SqlIndexingFixture.CreateAsync();
        await using var database = fixture.CreateContext();
        await database.Database.ExecuteSqlRawAsync("CREATE USER QuarryWorkerTest WITHOUT LOGIN; ALTER ROLE QuarryWorker ADD MEMBER QuarryWorkerTest;");
        await database.Database.OpenConnectionAsync();
        await database.Database.ExecuteSqlRawAsync("EXECUTE AS USER = 'QuarryWorkerTest';");
        try
        {
            var work = new SqlIndexWorkRepository(database);
            await work.EnqueueMissingAsync(TestEmbeddingProfile.Key, CancellationToken.None);
            var processor = new FrameworkIndexProcessor(database, work, new IndexingTestEmbeddingProvider(), Options.Create(TestEmbeddingProfile.Options), NullLogger<FrameworkIndexProcessor>.Instance);
            Assert.True(await processor.ProcessNextAsync(CancellationToken.None));
            Assert.Single(await database.FrameworkVectors.AsNoTracking().ToListAsync());
            foreach (var statement in new[] { "UPDATE FrameworkRevisions SET Name = Name;", "UPDATE FrameworkDrafts SET Revision = Revision;", "DELETE FROM MaintenanceAuditRecords;", "UPDATE PublishedFrameworkSnapshots SET Revision = Revision;" })
                await Assert.ThrowsAnyAsync<DbException>(() => database.Database.ExecuteSqlRawAsync(statement));
        }
        finally { await database.Database.ExecuteSqlRawAsync("REVERT;"); }
    }

    [SqlServerFact]
    public async Task MaintenanceRolePublishesAndRebuildsWithoutOwningSchemaOrChangingAuditHistory()
    {
        await using var fixture = await SqlMaintenanceFixture.CreateAsync();
        await using var database = fixture.CreateContext();
        await database.Database.ExecuteSqlRawAsync("CREATE USER QuarryMaintenanceTest WITHOUT LOGIN; ALTER ROLE QuarryMaintenance ADD MEMBER QuarryMaintenanceTest;");
        await database.Database.OpenConnectionAsync();
        await database.Database.ExecuteSqlRawAsync("EXECUTE AS USER = 'QuarryMaintenanceTest';");
        try
        {
            var id = Guid.NewGuid();
            var metadata = JsonSerializer.Deserialize<FrameworkMetadata>(SqlMaintenanceFixture.DraftBody(id).ToJsonString(), new JsonSerializerOptions(JsonSerializerDefaults.Web))!;
            Assert.True(await new SqlFrameworkDraftRepository(database).CreateAsync(Framework.CreateDraft(id, metadata), "restricted-operator", "create-correlation", CancellationToken.None));
            var work = new SqlIndexWorkRepository(database);
            var options = Options.Create(TestEmbeddingProfile.Options);
            var result = await new SqlFrameworkPublicationRepository(database, work, options).PublishAsync(id, "1",
                [new PublicationEvidence("capability", "forms", "documentation", "https://example.test/docs/forms"),
                 new PublicationEvidence("component", "text-input", "working-example", "https://example.test/examples/input")],
                "restricted-operator", "publish-correlation", CancellationToken.None);
            Assert.Equal(PublicationStatus.Published, result.Status);
            await new SqlFrameworkSearchIndexMaintenance(database, work, options).RebuildAsync("restricted-operator", "rebuild-correlation", CancellationToken.None);
            Assert.Equal(3, await database.MaintenanceAuditRecords.CountAsync());
            Assert.Single(await database.IndexWorkItems.ToListAsync());
            foreach (var statement in new[] { "UPDATE MaintenanceAuditRecords SET Outcome = Outcome;", "DELETE FROM PublishedFrameworkSnapshots;", "CREATE TABLE UnauthorizedTable (Id int);" })
                await Assert.ThrowsAnyAsync<DbException>(() => database.Database.ExecuteSqlRawAsync(statement));
        }
        finally { await database.Database.ExecuteSqlRawAsync("REVERT;"); }
    }
}
