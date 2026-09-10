// Acceptance Test
// Traces to: L2-001, L2-029, L2-041
// Description: Semantic search rejects blank project descriptions before invoking a provider.
using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;

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
}
