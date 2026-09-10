// Acceptance Test
// Traces to: L2-004, L2-009, L2-028, L2-041
// Description: Public catalog reads expose a bounded published page.
using System.Net;
using Microsoft.AspNetCore.Mvc.Testing;

namespace Quarry.Api.AcceptanceTests;

public sealed class BrowsePublishedFrameworksTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;

    public BrowsePublishedFrameworksTests(WebApplicationFactory<Program> factory)
    {
        _client = factory.CreateClient();
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
}
