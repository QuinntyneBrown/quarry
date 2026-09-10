// Acceptance Test
// Traces to: L2-004, L2-034, L2-041
// Description: All migrations create a usable SQL catalog; persisted metadata survives a new API host.
using System.Net;
using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Quarry.Infrastructure.Persistence;

namespace Quarry.Api.AcceptanceTests;

public sealed class SqlCatalogIntegrationTests
{
    [SqlServerFact]
    public async Task FreshMigrationsPersistPublishedMetadataForPublicApiReads()
    {
        var connection = new SqlConnectionStringBuilder(Environment.GetEnvironmentVariable("QUARRY_TEST_SQL"))
        {
            InitialCatalog = $"Quarry_Acceptance_{Guid.NewGuid():N}"
        };
        var options = new DbContextOptionsBuilder<QuarryDbContext>().UseSqlServer(connection.ConnectionString).Options;
        var frameworkId = Guid.NewGuid();
        await using var database = new QuarryDbContext(options);
        try
        {
            await database.Database.MigrateAsync();
            Assert.Empty(await database.Database.GetPendingMigrationsAsync());
            database.FrameworkRevisions.Add(new FrameworkRevisionEntity
            {
                Id = frameworkId, Name = "SQL acceptance fixture", Description = "Persisted metadata",
                Technology = "React", TagsJson = "[\"forms\"]", Revision = "1", IsPublished = true
            });
            await database.SaveChangesAsync();

            using var factory = new WebApplicationFactory<Program>().WithWebHostBuilder(builder =>
            {
                builder.UseSetting("ConnectionStrings:Quarry", connection.ConnectionString);
                builder.UseSetting("Catalog:SeedDevelopmentEvaluationData", "false");
            });
            using var client = factory.CreateClient();
            Assert.Equal(HttpStatusCode.OK, (await client.GetAsync("/health/ready")).StatusCode);
            using var page = JsonDocument.Parse(await client.GetStringAsync("/api/frameworks"));
            Assert.Equal(frameworkId, page.RootElement.GetProperty("items")[0].GetProperty("id").GetGuid());
            using var details = JsonDocument.Parse(await client.GetStringAsync($"/api/frameworks/{frameworkId:D}"));
            Assert.Equal("Persisted metadata", details.RootElement.GetProperty("summary").GetProperty("description").GetString());
            Assert.Empty(details.RootElement.GetProperty("capabilities").EnumerateArray());
            Assert.Empty(await database.FrameworkVectors.ToListAsync());
        }
        finally
        {
            // Only the uniquely named database created by this test is removed.
            await database.Database.EnsureDeletedAsync();
        }
    }
}
