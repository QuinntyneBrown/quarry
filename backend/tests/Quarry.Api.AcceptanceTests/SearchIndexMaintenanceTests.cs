// Acceptance Test
// Traces to: L2-028, L2-030, L2-041
// Description: Only explicitly configured, valid operator credentials dispatch index mutations.
using System.Net;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.IdentityModel.Tokens;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using Quarry.Application.Recommendations;

namespace Quarry.Api.AcceptanceTests;

public sealed class SearchIndexMaintenanceTests
{
    private readonly string _signingKey = Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));
    private readonly RecordingSearchIndexMaintenance _maintenance = new();

    [Fact]
    public async Task RebuildRejectsAnUnauthenticatedRequest()
    {
        using var factory = CreateFactory();
        using var client = factory.CreateClient();
        var response = await client.PostAsync("/api/maintenance/search-index/rebuild", null);
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        Assert.Equal(0, _maintenance.RebuildCount);
    }

    [Fact]
    public async Task RebuildRejectsAnAuthenticatedCallerWithoutMaintenancePermission()
    {
        using var factory = CreateFactory();
        using var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new("Bearer", CreateToken(permission: false));
        var response = await client.PostAsync("/api/maintenance/search-index/rebuild", null);
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        Assert.Equal(0, _maintenance.RebuildCount);
    }

    [Fact]
    public async Task ConfiguredOperatorCanDispatchRebuild()
    {
        using var factory = CreateFactory();
        using var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new("Bearer", CreateToken());
        var response = await client.PostAsync("/api/maintenance/search-index/rebuild", null);
        Assert.Equal(HttpStatusCode.Accepted, response.StatusCode);
        Assert.Equal(1, _maintenance.RebuildCount);
    }

    [Fact]
    public async Task MissingKeyDisablesMaintenanceAndPreservesPublicDiscovery()
    {
        using var factory = CreateFactory(configureKey: false);
        using var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new("Bearer", CreateToken(key: "development-only-signing-key-change-before-production"));
        var response = await client.PostAsync("/api/maintenance/search-index/rebuild", null);
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        Assert.Equal(0, _maintenance.RebuildCount);
        client.DefaultRequestHeaders.Authorization = null;
        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync("/api/frameworks")).StatusCode);
    }

    [Theory]
    [InlineData("issuer")]
    [InlineData("audience")]
    [InlineData("signature")]
    [InlineData("expired")]
    [InlineData("algorithm")]
    public async Task InvalidTokenCannotDispatchRebuild(string fault)
    {
        using var factory = CreateFactory();
        using var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new("Bearer", CreateToken(fault: fault));
        var response = await client.PostAsync("/api/maintenance/search-index/rebuild", null);
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        Assert.Equal(0, _maintenance.RebuildCount);
    }

    [Fact]
    public async Task PermissionWithoutAnActorIdentityCannotDispatchRebuild()
    {
        using var factory = CreateFactory();
        using var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new("Bearer", CreateToken(subject: false));
        var response = await client.PostAsync("/api/maintenance/search-index/rebuild", null);
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        Assert.Equal(0, _maintenance.RebuildCount);
    }

    private WebApplicationFactory<Program> CreateFactory(bool configureKey = true)
    {
        return new WebApplicationFactory<Program>().WithWebHostBuilder(builder =>
        {
            builder.UseSetting("Jwt:SigningKey", configureKey ? _signingKey : "");
            builder.UseSetting("Jwt:Issuer", "Quarry");
            builder.UseSetting("Jwt:Audience", "Quarry.Maintenance");
            builder.UseSetting("Catalog:SeedDevelopmentEvaluationData", "true");
            builder.ConfigureTestServices(services => services.AddSingleton<IFrameworkSearchIndexMaintenance>(_maintenance));
        });
    }

    private string CreateToken(bool permission = true, bool subject = true, string? key = null, string? fault = null)
    {
        var claims = new List<Claim>();
        if (subject) claims.Add(new Claim("sub", "test-operator"));
        if (permission) claims.Add(new Claim("permission", "maintenance"));
        var credentials = new SigningCredentials(
            new SymmetricSecurityKey(Encoding.UTF8.GetBytes(fault == "signature" ? new string('x', 64) : key ?? _signingKey)),
            fault == "algorithm" ? SecurityAlgorithms.HmacSha384 : SecurityAlgorithms.HmacSha256);
        var token = new JwtSecurityToken(
            fault == "issuer" ? "incorrect" : "Quarry",
            fault == "audience" ? "incorrect" : "Quarry.Maintenance",
            claims,
            expires: fault == "expired" ? DateTime.UtcNow.AddMinutes(-1) : DateTime.UtcNow.AddMinutes(5),
            signingCredentials: credentials);
        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
