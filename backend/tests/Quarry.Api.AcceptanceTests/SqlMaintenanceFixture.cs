using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json.Nodes;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Quarry.Infrastructure.Persistence;

namespace Quarry.Api.AcceptanceTests;

public sealed class SqlMaintenanceFixture : IAsyncDisposable
{
    private readonly string _key = Convert.ToBase64String(RandomNumberGenerator.GetBytes(32));
    private readonly string _connection = new SqlConnectionStringBuilder(Environment.GetEnvironmentVariable("QUARRY_TEST_SQL"))
    {
        InitialCatalog = $"Quarry_Acceptance_{Guid.NewGuid():N}"
    }.ConnectionString;
    public WebApplicationFactory<Program> Factory { get; private set; } = null!;

    public QuarryDbContext CreateContext() => new(new DbContextOptionsBuilder<QuarryDbContext>().UseSqlServer(_connection).Options);

    public static async Task<SqlMaintenanceFixture> CreateAsync()
    {
        var fixture = new SqlMaintenanceFixture();
        try
        {
            await using var database = fixture.CreateContext();
            await database.Database.MigrateAsync();
            fixture.Factory = new WebApplicationFactory<Program>().WithWebHostBuilder(builder =>
            {
                builder.UseSetting("ConnectionStrings:Quarry", fixture._connection);
                builder.UseSetting("Catalog:SeedDevelopmentEvaluationData", "false");
                builder.UseSetting("Jwt:SigningKey", fixture._key);
                builder.UseSetting("Jwt:Issuer", "Quarry");
                builder.UseSetting("Jwt:Audience", "Quarry.Maintenance");
            });
            return fixture;
        }
        catch { await fixture.DisposeAsync(); throw; }
    }

    public HttpClient CreateClient(bool authenticated = true, bool permission = true)
    {
        var client = Factory.CreateClient();
        if (!authenticated) return client;
        var claims = new List<Claim> { new("sub", "metadata-test-operator") };
        if (permission) claims.Add(new("permission", "maintenance"));
        var token = new JwtSecurityToken("Quarry", "Quarry.Maintenance", claims, expires: DateTime.UtcNow.AddMinutes(5),
            signingCredentials: new SigningCredentials(new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_key)), SecurityAlgorithms.HmacSha256));
        client.DefaultRequestHeaders.Authorization = new("Bearer", new JwtSecurityTokenHandler().WriteToken(token));
        return client;
    }

    public static JsonObject DraftBody(Guid id) => new()
    {
        ["id"] = id.ToString("D"), ["name"] = "  Fixture framework  ", ["description"] = "Form controls for staff tools",
        ["technology"] = "React", ["tags"] = new JsonArray("forms"), ["useCases"] = new JsonArray("Staff tools"),
        ["capabilities"] = new JsonArray(new JsonObject { ["id"] = "forms", ["description"] = "Supports data entry" }),
        ["components"] = new JsonArray(new JsonObject { ["id"] = "text-input", ["name"] = "Text input", ["description"] = "Editable text" })
    };

    public async ValueTask DisposeAsync()
    {
        if (Factory is not null) await Factory.DisposeAsync();
        await using var database = CreateContext();
        await database.Database.EnsureDeletedAsync();
    }
}
