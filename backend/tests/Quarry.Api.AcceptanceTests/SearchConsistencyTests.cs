// Acceptance Test
// Traces to: L2-003, L2-007, L2-008, L2-014, L2-033, L2-041
// Description: SQL-backed searches return current, same-revision metadata and bounded recovery under catalog changes.
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Quarry.Application.Recommendations;
using Quarry.Infrastructure.Persistence;

namespace Quarry.Api.AcceptanceTests;

public sealed class SearchConsistencyTests
{
    private static async Task<Guid> SeedAsync(SqlMaintenanceFixture fixture)
    {
        var id = Guid.NewGuid();
        await using var database = fixture.CreateContext();
        database.FrameworkRevisions.Add(new FrameworkRevisionEntity
        {
            Id = id, Name = "Original forms", Description = "Form controls", Technology = "React", Revision = "2", IsPublished = true,
            TagsJson = "[\"forms\"]", ComponentCount = 1,
            CapabilitiesJson = "[{\"Id\":\"forms\",\"Description\":\"Supports text entry.\"}]",
            ComponentsJson = "[]", UseCasesJson = "[]"
        });
        database.FrameworkVectors.Add(new FrameworkVectorEntity
        {
            FrameworkId = id, SourceRevision = "2", Model = "test-model", Dimensions = 2, ValuesJson = "[1,0]", IndexedAtUtc = DateTimeOffset.UtcNow
        });
        (await database.CatalogState.SingleAsync()).Revision = 10;
        await database.SaveChangesAsync();
        return id;
    }

    private static WebApplicationFactory<Program> CreateFactory(SqlMaintenanceFixture fixture, Func<Task>? afterRead = null)
        => fixture.Factory.WithWebHostBuilder(builder => builder.ConfigureTestServices(services =>
        {
            services.AddScoped<ITextEmbeddingProvider, SearchTestEmbeddingProvider>();
            if (afterRead is not null)
                services.AddScoped<IFrameworkVectorRepository>(provider =>
                    new InterleavingVectorRepository(provider.GetRequiredService<QuarryDbContext>(), afterRead));
        }));

    [SqlServerFact]
    public async Task SearchReportsTheCatalogRevisionForResultsAndEmptyFilters()
    {
        await using var fixture = await SqlMaintenanceFixture.CreateAsync();
        var id = await SeedAsync(fixture);
        using var factory = CreateFactory(fixture);
        using var client = factory.CreateClient();
        using var result = JsonDocument.Parse(await (await client.PostAsJsonAsync("/api/framework-searches", new { query = "forms", technology = "React" })).Content.ReadAsStringAsync());
        Assert.Equal("10", result.RootElement.GetProperty("catalogRevision").GetString());
        var item = Assert.Single(result.RootElement.GetProperty("items").EnumerateArray());
        Assert.Equal(id, item.GetProperty("id").GetGuid());
        Assert.Equal("2", item.GetProperty("revision").GetString());
        Assert.Equal("Supports text entry.", item.GetProperty("explanation").GetString());
        Assert.Equal("forms", item.GetProperty("supportingCapabilityIds")[0].GetString());
        using var empty = JsonDocument.Parse(await (await client.PostAsJsonAsync("/api/framework-searches", new { query = "forms", technology = "Vue" })).Content.ReadAsStringAsync());
        Assert.Equal("10", empty.RootElement.GetProperty("catalogRevision").GetString());
        Assert.Empty(empty.RootElement.GetProperty("items").EnumerateArray());
        Assert.False(empty.RootElement.GetProperty("isIndexIncomplete").GetBoolean());
    }

    [SqlServerFact]
    public async Task RepublishingDuringSearchCannotPairOldVectorsWithNewMetadata()
    {
        await using var fixture = await SqlMaintenanceFixture.CreateAsync();
        await SeedAsync(fixture);
        var reads = 0;
        using var factory = CreateFactory(fixture, async () =>
        {
            if (++reads != 1) return;
            await using var database = fixture.CreateContext();
            await using var transaction = await database.Database.BeginTransactionAsync();
            await database.Database.ExecuteSqlRawAsync("UPDATE CatalogState SET Revision = 11; UPDATE FrameworkRevisions SET Revision = '3', Name = 'Unindexed replacement';");
            await transaction.CommitAsync();
        });
        using var client = factory.CreateClient();
        var response = await client.PostAsJsonAsync("/api/framework-searches", new { query = "forms" });
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        using var result = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        Assert.Empty(result.RootElement.GetProperty("items").EnumerateArray());
        Assert.True(result.RootElement.GetProperty("isIndexIncomplete").GetBoolean());
        Assert.Equal("11", result.RootElement.GetProperty("catalogRevision").GetString());
        Assert.Equal(2, reads);
    }

    [SqlServerFact]
    public async Task WithdrawalDuringSearchRereadsEligibilityAndCompleteness()
    {
        await using var fixture = await SqlMaintenanceFixture.CreateAsync();
        await SeedAsync(fixture);
        var reads = 0;
        using var factory = CreateFactory(fixture, async () =>
        {
            if (++reads != 1) return;
            await using var database = fixture.CreateContext();
            await using var transaction = await database.Database.BeginTransactionAsync();
            await database.Database.ExecuteSqlRawAsync("UPDATE CatalogState SET Revision = 11; UPDATE FrameworkRevisions SET IsPublished = 0;");
            await transaction.CommitAsync();
        });
        using var client = factory.CreateClient();
        using var result = JsonDocument.Parse(await (await client.PostAsJsonAsync("/api/framework-searches", new { query = "forms" })).Content.ReadAsStringAsync());
        Assert.Empty(result.RootElement.GetProperty("items").EnumerateArray());
        Assert.False(result.RootElement.GetProperty("isIndexIncomplete").GetBoolean());
        Assert.Equal("11", result.RootElement.GetProperty("catalogRevision").GetString());
        Assert.Equal(2, reads);
    }

    [SqlServerFact]
    public async Task ContinuousCatalogChangesReturnSafeRetryableFailureAfterBoundedAttempts()
    {
        await using var fixture = await SqlMaintenanceFixture.CreateAsync();
        await SeedAsync(fixture);
        var reads = 0;
        using var factory = CreateFactory(fixture, async () =>
        {
            reads++;
            await using var database = fixture.CreateContext();
            await database.Database.ExecuteSqlRawAsync("UPDATE CatalogState SET Revision = Revision + 1;");
        });
        using var client = factory.CreateClient();
        var response = await client.PostAsJsonAsync("/api/framework-searches", new { query = "forms" });
        Assert.Equal(HttpStatusCode.ServiceUnavailable, response.StatusCode);
        using var error = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        Assert.Equal("catalog_changing", error.RootElement.GetProperty("code").GetString());
        Assert.False(string.IsNullOrWhiteSpace(error.RootElement.GetProperty("correlationId").GetString()));
        Assert.Equal(3, reads);
    }
}
