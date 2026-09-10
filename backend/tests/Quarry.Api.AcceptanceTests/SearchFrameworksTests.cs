// Acceptance Test
// Traces to: L2-001, L2-029, L2-041
// Description: Search input boundaries enter browse for empty text and reject invalid requests before embedding.
using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using Quarry.Application.Recommendations;
using System.Text.Json;

namespace Quarry.Api.AcceptanceTests;

public sealed class SearchFrameworksTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;

    public SearchFrameworksTests(WebApplicationFactory<Program> factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task PostFrameworkSearchesBrowsesWhitespaceQueryWithoutEmbedding()
    {
        var provider = new IndexingTestEmbeddingProvider();
        using var factory = new WebApplicationFactory<Program>().WithWebHostBuilder(builder =>
        {
            builder.UseSetting("Catalog:SeedDevelopmentEvaluationData", "true");
            builder.ConfigureTestServices(services => services.AddSingleton<ITextEmbeddingProvider>(provider));
        });
        using var client = factory.CreateClient();
        var response = await client.PostAsJsonAsync("/api/framework-searches", new { query = "   ", technology = "React" });
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        using var result = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        Assert.Equal(1, result.RootElement.GetProperty("total").GetInt32());
        Assert.False(result.RootElement.GetProperty("items")[0].TryGetProperty("rank", out _));
        Assert.Equal(0, provider.Calls);
    }

    [Fact]
    public async Task PostFrameworkSearchesRejectsUnsupportedTechnology()
    {
        var response = await _client.PostAsJsonAsync("/api/framework-searches", new { query = "Animal Hospital", technology = "Unsupported" });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task PostFrameworkSearchesRejectsAnOversizedRequestBody()
    {
        var response = await _client.PostAsJsonAsync("/api/framework-searches", new { query = new string('a', 17 * 1024) });

        Assert.Equal(HttpStatusCode.RequestEntityTooLarge, response.StatusCode);
    }

    [Fact]
    public async Task PostFrameworkSearchesStopsAtTheConfiguredRequestDeadline()
    {
        using var factory = new WebApplicationFactory<Program>().WithWebHostBuilder(builder =>
        {
            builder.UseSetting("Search:RequestTimeoutSeconds", "1");
            builder.ConfigureTestServices(services => services.AddSingleton<ITextEmbeddingProvider, WaitingTextEmbeddingProvider>());
        });
        using var client = factory.CreateClient();
        var response = await client.PostAsJsonAsync("/api/framework-searches", new { query = "Accessible forms" });

        Assert.Equal(HttpStatusCode.GatewayTimeout, response.StatusCode);
        using var error = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        Assert.Equal("search_deadline_exceeded", error.RootElement.GetProperty("code").GetString());
        Assert.False(string.IsNullOrWhiteSpace(error.RootElement.GetProperty("correlationId").GetString()));
    }
}
