// Acceptance Test
// Traces to: L2-029, L2-033, L2-041
// Description: Byte limits apply before binding and side effects, including requests without Content-Length.
using System.Net;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Quarry.Application.Recommendations;

namespace Quarry.Api.AcceptanceTests;

public sealed class RequestBoundaryTests
{
    private static HttpContent Body(string body, bool unknownLength) => unknownLength
        ? UnknownLengthContent.Json(body) : new StringContent(body, Encoding.UTF8, "application/json");

    private static async Task AssertTooLargeAsync(HttpResponseMessage response)
    {
        Assert.Equal(HttpStatusCode.RequestEntityTooLarge, response.StatusCode);
        using var error = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        Assert.Equal("request_body_too_large", error.RootElement.GetProperty("code").GetString());
        Assert.False(string.IsNullOrWhiteSpace(error.RootElement.GetProperty("correlationId").GetString()));
    }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task SearchAcceptsExactly16KiBButRejectsTheNextByteBeforeBinding(bool unknownLength)
    {
        var provider = new IndexingTestEmbeddingProvider();
        using var factory = new WebApplicationFactory<Program>().WithWebHostBuilder(builder =>
        {
            builder.UseSetting("Catalog:SeedDevelopmentEvaluationData", "true");
            builder.ConfigureTestServices(services => services.AddSingleton<ITextEmbeddingProvider>(provider));
        });
        factory.UseKestrel(options => options.Listen(IPAddress.Loopback, 0));
        using var client = factory.CreateClient();
        var json = "{\"query\":\"\",\"padding\":\"" + new string('界', 5000) + "\"}";
        var exactBody = json + new string(' ', 16 * 1024 - Encoding.UTF8.GetByteCount(json));
        using var accepted = await client.PostAsync("/api/framework-searches", Body(exactBody, unknownLength));
        Assert.Equal(HttpStatusCode.OK, accepted.StatusCode);
        using var oversized = await client.PostAsync("/api/framework-searches", Body(exactBody + " ", unknownLength));
        await AssertTooLargeAsync(oversized);
        using var malformed = await client.PostAsync("/api/framework-searches", Body(new string('x', 16 * 1024 + 1), unknownLength));
        await AssertTooLargeAsync(malformed);
        Assert.Equal(0, provider.Calls);
    }

    [SqlServerFact]
    public async Task OversizedMaintenanceBodiesCannotChangeMetadataOrScheduleWork()
    {
        await using var fixture = await SqlMaintenanceFixture.CreateAsync();
        fixture.Factory.UseKestrel(options => options.Listen(IPAddress.Loopback, 0));
        using var client = fixture.CreateClient();
        var id = Guid.NewGuid();
        Assert.Equal(HttpStatusCode.Created, (await client.PostAsJsonAsync("/api/maintenance/frameworks", SqlMaintenanceFixture.DraftBody(id))).StatusCode);
        var metadata = SqlMaintenanceFixture.DraftBody(id); metadata.Remove("id");
        var requests = new[]
        {
            (HttpMethod.Post, "/api/maintenance/frameworks", SqlMaintenanceFixture.DraftBody(Guid.NewGuid()).ToJsonString()),
            (HttpMethod.Put, $"/api/maintenance/frameworks/{id:D}", JsonSerializer.Serialize(new { expectedRevision = "1", metadata })),
            (HttpMethod.Post, $"/api/maintenance/frameworks/{id:D}/publish", "{\"expectedRevision\":\"1\",\"evidence\":[]}"),
            (HttpMethod.Post, $"/api/maintenance/frameworks/{id:D}/withdraw", "{\"expectedRevision\":\"1\"}"),
            (HttpMethod.Delete, $"/api/maintenance/frameworks/{id:D}", "{\"expectedRevision\":\"1\"}"),
            (HttpMethod.Post, "/api/maintenance/search-index/rebuild", "{}")
        };
        foreach (var unknownLength in new[] { false, true })
        foreach (var (method, route, json) in requests)
        {
            using var request = new HttpRequestMessage(method, route)
            {
                Content = Body(json + new string(' ', 16 * 1024 + 1 - Encoding.UTF8.GetByteCount(json)), unknownLength)
            };
            using var response = await client.SendAsync(request);
            await AssertTooLargeAsync(response);
        }
        await using var database = fixture.CreateContext();
        Assert.Equal("1", (await database.FrameworkDrafts.SingleAsync()).Revision);
        Assert.Equal(1, await database.MaintenanceAuditRecords.CountAsync());
        Assert.Empty(await database.FrameworkRevisions.ToListAsync());
        Assert.Empty(await database.PublishedFrameworkSnapshots.ToListAsync());
        Assert.Empty(await database.IndexWorkItems.ToListAsync());
        Assert.Equal(0, (await database.CatalogState.SingleAsync()).Revision);
    }

    [Theory]
    [InlineData("page=1")]
    [InlineData("pageNumber=2")]
    [InlineData("page-number=3")]
    [InlineData("PageNumber=")]
    public async Task PageNumberPaginationIsRejectedBeforeCatalogAccess(string query)
    {
        using var factory = new WebApplicationFactory<Program>().WithWebHostBuilder(builder =>
            builder.UseSetting("ConnectionStrings:Quarry", UnavailableCatalogConfiguration.ConnectionString));
        using var client = factory.CreateClient();
        using var response = await client.GetAsync("/api/frameworks?" + query);
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        using var error = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        Assert.Equal("unsupported_pagination", error.RootElement.GetProperty("code").GetString());
    }
}
