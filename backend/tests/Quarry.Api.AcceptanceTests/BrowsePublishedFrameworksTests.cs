// Acceptance Test
// Traces to: L2-004, L2-009, L2-028, L2-041
// Description: Public catalog reads expose a bounded published page.
using System.Net;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;

namespace Quarry.Api.AcceptanceTests;

public sealed class BrowsePublishedFrameworksTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;
    private readonly WebApplicationFactory<Program> _factory;

    public BrowsePublishedFrameworksTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory.WithWebHostBuilder(builder => builder.UseSetting("Catalog:SeedDevelopmentEvaluationData", "true"));
        _client = _factory.CreateClient();
    }

    [Fact]
    public async Task GetFrameworksReturnsPublishedPage()
    {
        var response = await _client.GetAsync("/api/frameworks");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadAsStringAsync();
        Assert.Contains("items", body);
        Assert.Contains("catalogRevision", body);
    }

    [Fact]
    public async Task GetFrameworksReturnsPublishedEntriesInOrdinalNameOrder()
    {
        using var seededFactory = _factory.WithWebHostBuilder(builder => builder.UseSetting("Catalog:SeedDevelopmentEvaluationData", "true"));
        using var seededClient = seededFactory.CreateClient();
        var response = await seededClient.GetAsync("/api/frameworks?pageSize=24");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        using var document = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        var items = document.RootElement.GetProperty("items");
        Assert.NotEmpty(items.EnumerateArray());
        Assert.Equal("Atlas", items[0].GetProperty("name").GetString());
        Assert.Equal(1, document.RootElement.GetProperty("total").GetInt32());
        Assert.False(document.RootElement.GetProperty("hasNextPage").GetBoolean());
    }

    [Fact]
    public async Task GetFrameworksRejectsAnOutOfRangePageSize()
    {
        var response = await _client.GetAsync("/api/frameworks?pageSize=25");

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task GetFrameworksFiltersPublishedEntriesByTechnology()
    {
        using var seededFactory = _factory.WithWebHostBuilder(builder => builder.UseSetting("Catalog:SeedDevelopmentEvaluationData", "true"));
        using var seededClient = seededFactory.CreateClient();
        var response = await seededClient.GetAsync("/api/frameworks?technology=Angular");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        using var document = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        Assert.Equal(0, document.RootElement.GetProperty("total").GetInt32());
        Assert.Empty(document.RootElement.GetProperty("items").EnumerateArray());
    }

    [Fact]
    public async Task GetFrameworkDetailsReturnsPublishedMetadata()
    {
        var response = await _client.GetAsync("/api/frameworks/3a23bcd2-2b42-492d-a95e-1dd1e3e3cc3f");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        using var document = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        Assert.Equal("Atlas", document.RootElement.GetProperty("summary").GetProperty("name").GetString());
        Assert.Equal("1", document.RootElement.GetProperty("summary").GetProperty("revision").GetString());
        Assert.NotEmpty(document.RootElement.GetProperty("capabilities").EnumerateArray());
        Assert.NotEmpty(document.RootElement.GetProperty("useCases").EnumerateArray());
        Assert.NotEmpty(document.RootElement.GetProperty("components").EnumerateArray());
    }

    [Fact]
    public async Task GetFrameworksRejectsUnsupportedTechnology()
    {
        var response = await _client.GetAsync("/api/frameworks?technology=Unsupported");

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task GetFrameworksRejectsAnInvalidCursor()
    {
        var response = await _client.GetAsync("/api/frameworks?cursor=invalid");

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task GetFrameworksReportsUnavailablePersistenceAsSafeServiceFailure()
    {
        using var productionFactory = new WebApplicationFactory<Program>().WithWebHostBuilder(builder =>
            builder.UseSetting("ConnectionStrings:Quarry", UnavailableCatalogConfiguration.ConnectionString));
        using var productionClient = productionFactory.CreateClient();

        var response = await productionClient.GetAsync("/api/frameworks");

        Assert.Equal(HttpStatusCode.ServiceUnavailable, response.StatusCode);
    }

    [Fact]
    public async Task GetFrameworkDetailsReportsUnavailablePersistenceAsSafeServiceFailure()
    {
        using var productionFactory = new WebApplicationFactory<Program>().WithWebHostBuilder(builder =>
            builder.UseSetting("ConnectionStrings:Quarry", UnavailableCatalogConfiguration.ConnectionString));
        using var productionClient = productionFactory.CreateClient();

        var response = await productionClient.GetAsync("/api/frameworks/3a23bcd2-2b42-492d-a95e-1dd1e3e3cc3f");

        Assert.Equal(HttpStatusCode.ServiceUnavailable, response.StatusCode);
    }

    [Fact]
    public async Task GetFrameworksRejectsTheOneHundredAndTwentyFirstReadInTheFixedWindow()
    {
        using var quotaFactory = new WebApplicationFactory<Program>().WithWebHostBuilder(builder => builder.UseSetting("Catalog:SeedDevelopmentEvaluationData", "true"));
        using var quotaClient = quotaFactory.CreateClient();

        for (var request = 0; request < 120; request++)
        {
            using var response = await quotaClient.GetAsync("/api/frameworks");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        using var rejectedResponse = await quotaClient.GetAsync("/api/frameworks");

        Assert.Equal((HttpStatusCode)429, rejectedResponse.StatusCode);
        Assert.True(rejectedResponse.Headers.Contains("Retry-After"));
    }

    [Fact]
    public async Task SearchRejectsTheThirtyFirstRequestInTheFixedWindowBeforeProcessingIt()
    {
        using var quotaFactory = new WebApplicationFactory<Program>().WithWebHostBuilder(builder => builder.UseSetting("Catalog:SeedDevelopmentEvaluationData", "true"));
        using var quotaClient = quotaFactory.CreateClient();

        for (var request = 0; request < 30; request++)
        {
            using var content = new StringContent("{\"query\":null}", Encoding.UTF8, "application/json");
            using var response = await quotaClient.PostAsync("/api/framework-searches", content);
            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        }

        using var rejectedContent = new StringContent("{\"query\":null}", Encoding.UTF8, "application/json");
        using var rejectedResponse = await quotaClient.PostAsync("/api/framework-searches", rejectedContent);

        Assert.Equal((HttpStatusCode)429, rejectedResponse.StatusCode);
        Assert.True(rejectedResponse.Headers.Contains("Retry-After"));
    }
}
