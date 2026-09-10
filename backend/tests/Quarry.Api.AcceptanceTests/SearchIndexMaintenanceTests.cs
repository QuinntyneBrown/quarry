// Acceptance Test
// Traces to: L2-028, L2-041
// Description: Search index mutations require maintenance authorization.
using System.Net;
using Microsoft.AspNetCore.Mvc.Testing;

namespace Quarry.Api.AcceptanceTests;

public sealed class SearchIndexMaintenanceTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;

    public SearchIndexMaintenanceTests(WebApplicationFactory<Program> factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task RebuildRejectsAnUnauthenticatedRequest()
    {
        var response = await _client.PostAsync("/api/maintenance/search-index/rebuild", null);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }
}
