// Acceptance Test
// Traces to: L2-028, L2-030, L2-034, L2-037, L2-041
// Description: Coarse readiness and protected diagnostics distinguish dependencies and revision freshness.
using System.Net;
using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Quarry.Application.Recommendations;
using Quarry.Infrastructure.Persistence;
using Quarry.Infrastructure.Recommendations;

namespace Quarry.Api.AcceptanceTests;

public sealed class OperationalHealthTests
{
    private static WebApplicationFactory<Program> Configure(SqlMaintenanceFixture fixture, IndexingTestEmbeddingProvider provider, bool invalidConfiguration = false)
        => fixture.Factory.WithWebHostBuilder(builder => builder.ConfigureTestServices(services =>
        {
            services.RemoveAll<ITextEmbeddingProvider>();
            services.AddSingleton<ITextEmbeddingProvider>(provider);
            services.PostConfigure<OllamaEmbeddingOptions>(options =>
            {
                options.Model = TestEmbeddingProfile.Options.Model;
                options.ModelDigest = TestEmbeddingProfile.Options.ModelDigest;
                options.Dimensions = invalidConfiguration ? 0 : 2;
            });
        }));

    private static HttpClient OperatorClient(SqlMaintenanceFixture fixture, WebApplicationFactory<Program> factory, bool permission = true)
    {
        using var authenticated = fixture.CreateClient(permission: permission);
        var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = authenticated.DefaultRequestHeaders.Authorization;
        return client;
    }

    [SqlServerFact]
    public async Task HealthyEmptyCatalogHasCoarsePublicHealthAndProtectedDiagnostics()
    {
        await using var fixture = await SqlMaintenanceFixture.CreateAsync();
        var provider = new IndexingTestEmbeddingProvider();
        using var factory = Configure(fixture, provider);
        using var anonymous = factory.CreateClient();
        using var denied = OperatorClient(fixture, factory, permission: false);
        Assert.Equal(HttpStatusCode.Unauthorized, (await anonymous.GetAsync("/api/maintenance/diagnostics")).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await denied.GetAsync("/api/maintenance/diagnostics")).StatusCode);
        Assert.Equal(0, provider.Calls);
        foreach (var path in new[] { "/health/live", "/health/ready", "/health/catalog", "/health/search", "/health/indexing" })
        {
            var response = await anonymous.GetAsync(path);
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            using var document = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
            Assert.Single(document.RootElement.EnumerateObject());
            Assert.Equal("healthy", document.RootElement.GetProperty("status").GetString());
        }
        using var authorized = OperatorClient(fixture, factory);
        using var diagnostics = JsonDocument.Parse(await authorized.GetStringAsync("/api/maintenance/diagnostics"));
        Assert.False(string.IsNullOrWhiteSpace(diagnostics.RootElement.GetProperty("correlationId").GetString()));
        var health = diagnostics.RootElement.GetProperty("health");
        Assert.Equal("healthy", health.GetProperty("catalogStatus").GetString());
        Assert.Equal("healthy", health.GetProperty("searchStatus").GetString());
        Assert.Equal(0, health.GetProperty("index").GetProperty("publishedCount").GetInt32());
        Assert.Equal("quarry-health-v1", provider.LastInput);
    }

    [SqlServerFact]
    public async Task BacklogReportsStaleRevisionFailuresAndFreshnessThenRecovers()
    {
        await using var fixture = await SqlMaintenanceFixture.CreateAsync();
        var provider = new IndexingTestEmbeddingProvider();
        using var factory = Configure(fixture, provider);
        using var client = OperatorClient(fixture, factory);
        await using var database = fixture.CreateContext();
        var id = Guid.NewGuid();
        database.FrameworkRevisions.Add(new FrameworkRevisionEntity { Id = id, Name = "Health fixture", Technology = "React", Description = "Fixture description", Revision = "2", IsPublished = true });
        var vector = new FrameworkVectorEntity { FrameworkId = id, SourceRevision = "1", Model = TestEmbeddingProfile.Key, Dimensions = 2, ValuesJson = "[1,0]", IndexedAtUtc = DateTimeOffset.UtcNow.AddMinutes(-3) };
        database.FrameworkVectors.Add(vector);
        var work = new IndexWorkItemEntity { Id = Guid.NewGuid(), FrameworkId = id, SourceRevision = "2", Model = TestEmbeddingProfile.Key, State = "pending", AttemptCount = 2,
            CreatedAtUtc = DateTimeOffset.UtcNow.AddMinutes(-2), NextAttemptAtUtc = DateTimeOffset.UtcNow, LastError = "embedding_unavailable" };
        database.IndexWorkItems.Add(work);
        await database.SaveChangesAsync();
        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync("/health/catalog")).StatusCode);
        var readiness = await client.GetAsync("/health/search");
        Assert.Equal(HttpStatusCode.ServiceUnavailable, readiness.StatusCode);
        using var report = JsonDocument.Parse(await client.GetStringAsync("/api/maintenance/diagnostics"));
        var health = report.RootElement.GetProperty("health");
        Assert.Equal("degraded", health.GetProperty("searchStatus").GetString());
        var index = health.GetProperty("index");
        Assert.Equal(1, index.GetProperty("pendingCount").GetInt32());
        Assert.Equal(1, index.GetProperty("failureCount").GetInt32());
        Assert.Equal(0, index.GetProperty("searchableCount").GetInt32());
        Assert.True(index.GetProperty("oldestPendingAgeSeconds").GetDouble() >= 120);
        Assert.True(index.GetProperty("freshnessTargetBreached").GetBoolean());
        var revision = Assert.Single(index.GetProperty("revisions").EnumerateArray());
        Assert.Equal(id, revision.GetProperty("frameworkId").GetGuid());
        Assert.Equal("2", revision.GetProperty("sourceRevision").GetString());
        Assert.Equal("1", revision.GetProperty("indexedRevision").GetString());
        Assert.False(revision.GetProperty("isSearchable").GetBoolean());
        vector.SourceRevision = "2"; work.State = "completed"; work.LastError = null;
        await database.SaveChangesAsync();
        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync("/health/search")).StatusCode);
        using var recovered = JsonDocument.Parse(await client.GetStringAsync("/api/maintenance/diagnostics"));
        var recoveredIndex = recovered.RootElement.GetProperty("health").GetProperty("index");
        Assert.Equal(1, recoveredIndex.GetProperty("searchableCount").GetInt32());
        Assert.Equal(0, recoveredIndex.GetProperty("pendingCount").GetInt32());
        Assert.False(recoveredIndex.GetProperty("freshnessTargetBreached").GetBoolean());
    }

    [SqlServerFact]
    public async Task EmbeddingOutageAndInvalidConfigurationDoNotDisableCatalogReadiness()
    {
        await using var fixture = await SqlMaintenanceFixture.CreateAsync();
        var provider = new IndexingTestEmbeddingProvider { FailNext = true };
        using var factory = Configure(fixture, provider);
        using var client = OperatorClient(fixture, factory);
        var response = await client.GetAsync("/health/search");
        Assert.Equal(HttpStatusCode.ServiceUnavailable, response.StatusCode);
        Assert.DoesNotContain("Synthetic", await response.Content.ReadAsStringAsync());
        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync("/health/catalog")).StatusCode);
        provider.FailNext = true;
        using var report = JsonDocument.Parse(await client.GetStringAsync("/api/maintenance/diagnostics"));
        Assert.Contains(report.RootElement.GetProperty("health").GetProperty("issues").EnumerateArray(), issue => issue.GetString() == "embedding_unavailable");
        using var invalidFactory = Configure(fixture, provider, invalidConfiguration: true);
        using var invalidClient = OperatorClient(fixture, invalidFactory);
        var before = provider.Calls;
        Assert.Equal(HttpStatusCode.OK, (await invalidClient.GetAsync("/health/catalog")).StatusCode);
        Assert.Equal(HttpStatusCode.ServiceUnavailable, (await invalidClient.GetAsync("/health/search")).StatusCode);
        using var invalidReport = JsonDocument.Parse(await invalidClient.GetStringAsync("/api/maintenance/diagnostics"));
        Assert.Contains(invalidReport.RootElement.GetProperty("health").GetProperty("issues").EnumerateArray(), issue => issue.GetString() == "embedding_configuration_invalid");
        Assert.Equal(before, provider.Calls);
    }

    [SqlServerFact]
    public async Task MalformedPersistenceConfigurationProducesSafeOperatorGuidance()
    {
        await using var fixture = await SqlMaintenanceFixture.CreateAsync();
        var provider = new IndexingTestEmbeddingProvider();
        using var factory = Configure(fixture, provider).WithWebHostBuilder(builder =>
            builder.UseSetting("ConnectionStrings:Quarry", "invalid-sensitive-connection-value"));
        using var client = OperatorClient(fixture, factory);
        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync("/health/live")).StatusCode);
        var response = await client.GetAsync("/health/search");
        Assert.Equal(HttpStatusCode.ServiceUnavailable, response.StatusCode);
        Assert.DoesNotContain("sensitive", await response.Content.ReadAsStringAsync());
        using var report = JsonDocument.Parse(await client.GetStringAsync("/api/maintenance/diagnostics"));
        Assert.Contains(report.RootElement.GetProperty("health").GetProperty("issues").EnumerateArray(), issue => issue.GetString() == "catalog_configuration_invalid");
        Assert.Equal(0, provider.Calls);
    }

    [SqlServerFact]
    public async Task CorruptVectorsAndIncompatibleEmbeddingProbeNeverClaimSearchReadiness()
    {
        await using var fixture = await SqlMaintenanceFixture.CreateAsync();
        var provider = new IndexingTestEmbeddingProvider();
        using var factory = Configure(fixture, provider);
        using var client = OperatorClient(fixture, factory);
        await using var database = fixture.CreateContext();
        var id = Guid.NewGuid();
        database.FrameworkRevisions.Add(new FrameworkRevisionEntity { Id = id, Name = "Health fixture", Technology = "React", Revision = "1", IsPublished = true });
        var vector = new FrameworkVectorEntity { FrameworkId = id, SourceRevision = "1", Model = TestEmbeddingProfile.Key, Dimensions = 2, ValuesJson = "[0,0]" };
        database.FrameworkVectors.Add(vector);
        await database.SaveChangesAsync();
        foreach (var json in new[] { "[0,0]", "[]", "not-json" })
        {
            vector.ValuesJson = json; await database.SaveChangesAsync();
            Assert.Equal(HttpStatusCode.ServiceUnavailable, (await client.GetAsync("/health/indexing")).StatusCode);
        }
        vector.ValuesJson = "[1,0]"; await database.SaveChangesAsync();
        provider.ModelKey = "incompatible-model";
        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync("/health/indexing")).StatusCode);
        Assert.Equal(HttpStatusCode.ServiceUnavailable, (await client.GetAsync("/health/search")).StatusCode);
        using var report = JsonDocument.Parse(await client.GetStringAsync("/api/maintenance/diagnostics"));
        Assert.Contains(report.RootElement.GetProperty("health").GetProperty("issues").EnumerateArray(), issue => issue.GetString() == "embedding_incompatible");
    }
}
