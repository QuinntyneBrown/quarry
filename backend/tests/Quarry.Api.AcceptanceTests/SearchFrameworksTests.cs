// Acceptance Test
// Traces to: L2-001, L2-029, L2-041
// Description: Semantic search rejects blank project descriptions before invoking a provider.
using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using Quarry.Application.Recommendations;

namespace Quarry.Api.AcceptanceTests;

public sealed class SearchFrameworksTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;

    public SearchFrameworksTests(WebApplicationFactory<Program> factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task PostFrameworkSearchesRejectsWhitespaceQuery()
    {
        var response = await _client.PostAsJsonAsync("/api/framework-searches", new { query = "   " });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
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
    }
}
