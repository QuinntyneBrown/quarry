// Acceptance Test
// Traces to: L2-030, L2-037, L2-041
// Description: Request and indexing diagnostic events carry safe identities, timing and outcome without query content.
using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Microsoft.EntityFrameworkCore;
using Quarry.Application.Recommendations;
using Quarry.Infrastructure.Recommendations;

namespace Quarry.Api.AcceptanceTests;

public sealed class DiagnosticLoggingTests
{
    [Fact]
    public async Task SuccessfulAndFailedRequestsEmitSafeStructuredEvents()
    {
        const string sensitiveQuery = "private-client-query-5910";
        var logs = new RecordingLogProvider();
        var provider = new IndexingTestEmbeddingProvider();
        using var factory = new WebApplicationFactory<Program>().WithWebHostBuilder(builder => builder.ConfigureTestServices(services =>
        {
            services.AddLogging(logging => logging.AddProvider(logs));
            services.AddSingleton<ITextEmbeddingProvider>(provider);
            services.AddSingleton<IFrameworkVectorRepository, SearchTestVectorRepository>();
        }));
        using var client = factory.CreateClient();
        Assert.Equal(HttpStatusCode.OK, (await client.PostAsJsonAsync("/api/framework-searches", new { query = sensitiveQuery })).StatusCode);
        provider.FailNext = true;
        Assert.Equal(HttpStatusCode.ServiceUnavailable, (await client.PostAsJsonAsync("/api/framework-searches", new { query = sensitiveQuery })).StatusCode);
        var events = logs.Entries.Where(entry => entry.Properties.ContainsKey("Operation") && Equals(entry.Properties["Operation"], "FrameworkSearches.Search")).ToArray();
        Assert.Equal(2, events.Length);
        Assert.Equal("succeeded", events[0].Properties["Outcome"]);
        Assert.Equal("none", events[0].Properties["ErrorCategory"]);
        Assert.Equal("failed", events[1].Properties["Outcome"]);
        Assert.Equal("service_unavailable", events[1].Properties["ErrorCategory"]);
        foreach (var entry in events)
        {
            Assert.False(string.IsNullOrWhiteSpace(Assert.IsType<string>(entry.Properties["CorrelationId"])));
            Assert.True(Assert.IsType<double>(entry.Properties["DurationMs"]) >= 0);
            Assert.Null(entry.Exception);
        }
        Assert.DoesNotContain(sensitiveQuery, string.Join("\n", logs.Entries.Select(entry => entry.Message + entry.Exception)));
    }

    [SqlServerFact]
    public async Task IndexFailureRecordsWorkIdentityAndSafeCategoryWithoutFrameworkInput()
    {
        const string privateDescription = "private-evaluation-description-5910";
        await using var fixture = await SqlIndexingFixture.CreateAsync();
        await using var database = fixture.CreateContext();
        await database.FrameworkRevisions.ExecuteUpdateAsync(setters => setters.SetProperty(item => item.Description, privateDescription));
        var logs = new RecordingLogProvider();
        using var loggerFactory = LoggerFactory.Create(builder => builder.AddProvider(logs));
        var processor = new FrameworkIndexProcessor(database, new SqlIndexWorkRepository(database), new IndexingTestEmbeddingProvider { FailNext = true },
            Options.Create(TestEmbeddingProfile.Options), loggerFactory.CreateLogger<FrameworkIndexProcessor>());
        Assert.True(await processor.ProcessNextAsync(CancellationToken.None));
        var entry = Assert.Single(logs.Entries);
        Assert.Equal("framework-index", entry.Properties["Operation"]);
        Assert.IsType<Guid>(entry.Properties["WorkId"]);
        Assert.Equal(fixture.FrameworkId, entry.Properties["FrameworkId"]);
        Assert.Equal("1", entry.Properties["SourceRevision"]);
        Assert.Equal("failed", entry.Properties["Outcome"]);
        Assert.Equal("embedding_service_unavailable", entry.Properties["ErrorCategory"]);
        Assert.True(Assert.IsType<double>(entry.Properties["DurationMs"]) >= 0);
        Assert.DoesNotContain(privateDescription, entry.Message);
        Assert.Null(entry.Exception);
    }
}
