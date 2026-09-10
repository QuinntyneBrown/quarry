// Acceptance Test
// Traces to: L2-028, L2-041
// Description: Search index mutations require maintenance authorization.
using System.Net;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.IdentityModel.Tokens;

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

    [Fact]
    public async Task RebuildRejectsAnAuthenticatedCallerWithoutMaintenancePermission()
    {
        _client.DefaultRequestHeaders.Authorization = new("Bearer", CreateToken());

        var response = await _client.PostAsync("/api/maintenance/search-index/rebuild", null);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    private static string CreateToken()
    {
        var credentials = new SigningCredentials(new SymmetricSecurityKey(Encoding.UTF8.GetBytes("development-only-signing-key-change-before-production")), SecurityAlgorithms.HmacSha256);
        var token = new JwtSecurityToken("Quarry", "Quarry.Maintenance", [new Claim(ClaimTypes.NameIdentifier, "test-user")], expires: DateTime.UtcNow.AddMinutes(5), signingCredentials: credentials);
        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
