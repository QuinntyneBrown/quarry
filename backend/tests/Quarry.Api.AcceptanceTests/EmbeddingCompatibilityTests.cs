// Acceptance Test
// Traces to: L2-005, L2-008, L2-033, L2-034, L2-041
// Description: Search and durable indexing use the complete pinned model and input identity.
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Quarry.Application.Recommendations;
using Quarry.Infrastructure.Persistence;
using Quarry.Infrastructure.Recommendations;

namespace Quarry.Api.AcceptanceTests;

public sealed class EmbeddingCompatibilityTests
{
    private const string Key = "embeddinggemma:300m@85462619ee721b466c5927d109d4cb765861907d5417b9109caebc4e614679f1/768/quarry-embedding-v1";

    [SqlServerFact]
    public async Task SearchExcludesLegacyDigestAndInputVersionsUntilCompatibleIndexingCompletes()
    {
        await using var fixture = await SqlMaintenanceFixture.CreateAsync();
        var id = Guid.NewGuid();
        await using var database = fixture.CreateContext();
        database.FrameworkRevisions.Add(new FrameworkRevisionEntity
        {
            Id = id, Name = "Compatibility fixture", Description = "Forms", Technology = "React", IsPublished = true, Revision = "1",
            TagsJson = "[\"forms\"]", CapabilitiesJson = "[{\"Id\":\"forms\",\"Description\":\"Supports forms.\"}]"
        });
        var vector = new FrameworkVectorEntity
        {
            FrameworkId = id, SourceRevision = "1", Model = "embeddinggemma:300m", Dimensions = 768,
            ValuesJson = JsonSerializer.Serialize(Enumerable.Repeat(0.25f, 768)), IndexedAtUtc = DateTimeOffset.UtcNow
        };
        database.FrameworkVectors.Add(vector);
        await database.SaveChangesAsync();
        using var providerClient = new HttpClient(new EmbeddingResponseHandler()) { BaseAddress = new Uri("http://localhost:11434/") };
        using var factory = fixture.Factory.WithWebHostBuilder(builder => builder.ConfigureTestServices(services =>
            services.AddScoped<ITextEmbeddingProvider>(_ => new OllamaTextEmbeddingProvider(providerClient, Options.Create(new OllamaEmbeddingOptions())))));
        using var client = factory.CreateClient();
        foreach (var incompatible in new[] { "embeddinggemma:300m", Key.Replace("85462619", "aaaaaaaa"), Key.Replace("-v1", "-v0") })
        {
            vector.Model = incompatible;
            await database.SaveChangesAsync();
            using var result = JsonDocument.Parse(await (await client.PostAsJsonAsync("/api/framework-searches", new { query = "forms" })).Content.ReadAsStringAsync());
            Assert.Empty(result.RootElement.GetProperty("items").EnumerateArray());
            Assert.True(result.RootElement.GetProperty("isIndexIncomplete").GetBoolean());
        }
        vector.Model = Key;
        await database.SaveChangesAsync();
        using var recovered = JsonDocument.Parse(await (await client.PostAsJsonAsync("/api/framework-searches", new { query = "forms" })).Content.ReadAsStringAsync());
        Assert.Single(recovered.RootElement.GetProperty("items").EnumerateArray());
        Assert.False(recovered.RootElement.GetProperty("isIndexIncomplete").GetBoolean());
    }

    [SqlServerFact]
    public async Task PublicationAndRebuildUseTheSameFullCompatibilityIdentity()
    {
        await using var fixture = await SqlMaintenanceFixture.CreateAsync();
        using var client = fixture.CreateClient();
        var id = Guid.NewGuid();
        Assert.Equal(HttpStatusCode.Created, (await client.PostAsJsonAsync("/api/maintenance/frameworks", SqlMaintenanceFixture.DraftBody(id))).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await client.PostAsJsonAsync($"/api/maintenance/frameworks/{id}/publish", new
        {
            expectedRevision = "1",
            evidence = new[]
            {
                new { targetType = "capability", targetId = "forms", kind = "documentation", source = "https://example.test/forms" },
                new { targetType = "component", targetId = "text-input", kind = "working-example", source = "https://example.test/input" }
            }
        })).StatusCode);
        await using var database = fixture.CreateContext();
        Assert.Equal(Key, (await database.IndexWorkItems.SingleAsync()).Model);
        Assert.True((await client.PostAsync("/api/maintenance/search-index/rebuild", null)).IsSuccessStatusCode);
        Assert.Equal(Key, (await database.IndexWorkItems.SingleAsync()).Model);
    }

    [Fact]
    public async Task WrongInstalledDigestReturnsSafeServiceErrorBeforeRetrieval()
    {
        using var providerClient = new HttpClient(new EmbeddingResponseHandler { Digest = new string('a', 64) }) { BaseAddress = new Uri("http://localhost:11434/") };
        using var factory = new WebApplicationFactory<Program>().WithWebHostBuilder(builder => builder.ConfigureTestServices(services =>
        {
            services.AddScoped<ITextEmbeddingProvider>(_ => new OllamaTextEmbeddingProvider(providerClient, Options.Create(new OllamaEmbeddingOptions())));
            services.AddScoped<IFrameworkVectorRepository, SearchTestVectorRepository>();
        }));
        using var client = factory.CreateClient();
        var response = await client.PostAsJsonAsync("/api/framework-searches", new { query = "Sensitive query" });
        Assert.Equal(HttpStatusCode.ServiceUnavailable, response.StatusCode);
        var body = await response.Content.ReadAsStringAsync();
        Assert.Contains("embedding_model_incompatible", body);
        Assert.Contains("correlationId", body);
        Assert.DoesNotContain("Sensitive query", body);
        Assert.DoesNotContain(new string('a', 64), body);
    }
}
