// Acceptance Test
// Traces to: L2-029, L2-030, L2-037, L2-041
// Description: Binding failures return a stable safe contract without reflecting input or causing work.
using System.Net;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Quarry.Application.Recommendations;

namespace Quarry.Api.AcceptanceTests;

public sealed class InvalidRequestTests
{
    private const string Marker = "private-malformed-query-6241";

    [Theory]
    [InlineData("")]
    [InlineData("null")]
    [InlineData("[]")]
    [InlineData("{\"query\":")]
    [InlineData("{\"query\":{\"private-malformed-query-6241\":true}}")]
    [InlineData("{\"query\":\"private-malformed-query-6241\",\"technology\":[]}")]
    public async Task MalformedSearchBodiesAreRejectedBeforeEmbeddingWithoutReflectingInput(string body)
    {
        var provider = new IndexingTestEmbeddingProvider();
        var logs = new RecordingLogProvider();
        using var factory = new WebApplicationFactory<Program>().WithWebHostBuilder(builder =>
        {
            builder.UseSetting("Catalog:SeedDevelopmentEvaluationData", "true");
            builder.ConfigureTestServices(services =>
            {
                services.AddSingleton<ITextEmbeddingProvider>(provider);
                services.AddLogging(logging => logging.AddProvider(logs));
            });
        });
        factory.UseKestrel(options => options.Listen(IPAddress.Loopback, 0));
        using var client = factory.CreateClient();
        using var response = await client.PostAsync("/api/framework-searches", Json(body));
        await AssertSafeInvalidRequestAsync(response);
        Assert.Equal(0, provider.Calls);
        Assert.DoesNotContain(Marker, string.Join("\n", logs.Entries.Select(entry => entry.Message + entry.Exception)));
    }

    [Theory]
    [InlineData("private-malformed-query-6241")]
    [InlineData("2147483648")]
    public async Task InvalidPageSizeBindingDoesNotExposeTheSubmittedValue(string pageSize)
    {
        using var factory = new WebApplicationFactory<Program>().WithWebHostBuilder(builder =>
            builder.UseSetting("ConnectionStrings:Quarry", "Server=invalid.example;Database=Unavailable;Connect Timeout=1;"));
        factory.UseKestrel(options => options.Listen(IPAddress.Loopback, 0));
        using var client = factory.CreateClient();
        using var response = await client.GetAsync("/api/frameworks?pageSize=" + pageSize);
        await AssertSafeInvalidRequestAsync(response);
        Assert.DoesNotContain(pageSize, await response.Content.ReadAsStringAsync());
    }

    [SqlServerFact]
    public async Task MalformedMaintenanceBodiesCannotChangeDraftsPublicationsAuditOrWork()
    {
        await using var fixture = await SqlMaintenanceFixture.CreateAsync();
        fixture.Factory.UseKestrel(options => options.Listen(IPAddress.Loopback, 0));
        using var client = fixture.CreateClient();
        var id = Guid.NewGuid();
        Assert.Equal(HttpStatusCode.Created, (await client.PostAsJsonAsync("/api/maintenance/frameworks", SqlMaintenanceFixture.DraftBody(id))).StatusCode);
        var requests = new[]
        {
            (HttpMethod.Post, "/api/maintenance/frameworks", "{\"id\":\"" + Marker + "\"}"),
            (HttpMethod.Put, $"/api/maintenance/frameworks/{id:D}", "{\"metadata\":[],\"expectedRevision\":\"1\"}"),
            (HttpMethod.Post, $"/api/maintenance/frameworks/{id:D}/publish", "{\"expectedRevision\":\"1\",\"evidence\":{}}"),
            (HttpMethod.Post, $"/api/maintenance/frameworks/{id:D}/withdraw", "{\"expectedRevision\":[]}"),
            (HttpMethod.Delete, $"/api/maintenance/frameworks/{id:D}", "null")
        };
        foreach (var (method, route, body) in requests)
        {
            using var request = new HttpRequestMessage(method, route) { Content = Json(body) };
            using var response = await client.SendAsync(request);
            await AssertSafeInvalidRequestAsync(response);
        }
        await using var database = fixture.CreateContext();
        Assert.Equal("1", (await database.FrameworkDrafts.SingleAsync()).Revision);
        Assert.Equal(1, await database.MaintenanceAuditRecords.CountAsync());
        Assert.Empty(await database.FrameworkRevisions.ToListAsync());
        Assert.Empty(await database.PublishedFrameworkSnapshots.ToListAsync());
        Assert.Empty(await database.IndexWorkItems.ToListAsync());
    }

    private static StringContent Json(string body) => new(body, Encoding.UTF8, "application/json");

    private static async Task AssertSafeInvalidRequestAsync(HttpResponseMessage response)
    {
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var body = await response.Content.ReadAsStringAsync();
        Assert.DoesNotContain(Marker, body);
        using var json = JsonDocument.Parse(body);
        Assert.Equal("invalid_request", json.RootElement.GetProperty("code").GetString());
        Assert.False(string.IsNullOrWhiteSpace(json.RootElement.GetProperty("correlationId").GetString()));
        Assert.Equal(2, json.RootElement.EnumerateObject().Count());
    }
}
