// Acceptance Test
// Traces to: L2-028, L2-034, L2-041
// Description: Authorized rebuild and operator audit commit together; audit failure rolls back invalidation.
using System.IdentityModel.Tokens.Jwt;
using System.Net;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Quarry.Infrastructure.Persistence;

namespace Quarry.Api.AcceptanceTests;

public sealed class SqlRebuildAuditTests
{
    [SqlServerFact]
    public Task AcceptedRebuildRecordsTheAuthenticatedActor()
    {
        return VerifyRebuildAsync(failAudit: false);
    }

    [SqlServerFact]
    public Task AuditFailureRollsBackVectorInvalidation()
    {
        return VerifyRebuildAsync(failAudit: true);
    }

    private static async Task VerifyRebuildAsync(bool failAudit)
    {
        var connection = new SqlConnectionStringBuilder(Environment.GetEnvironmentVariable("QUARRY_TEST_SQL"))
        {
            InitialCatalog = $"Quarry_Acceptance_{Guid.NewGuid():N}"
        };
        var options = new DbContextOptionsBuilder<QuarryDbContext>().UseSqlServer(connection.ConnectionString).Options;
        await using var database = new QuarryDbContext(options);
        try
        {
            await database.Database.MigrateAsync();
            var publishedId = Guid.NewGuid();
            database.FrameworkRevisions.Add(new FrameworkRevisionEntity
            {
                Id = publishedId, Name = "Published fixture", Description = "Scheduling tools", Technology = "React", Revision = "1", IsPublished = true
            });
            database.FrameworkRevisions.Add(new FrameworkRevisionEntity
            {
                Id = Guid.NewGuid(), Name = "Draft fixture", Description = "Private tools", Technology = "React", Revision = "1", IsPublished = false
            });
            database.FrameworkVectors.Add(new FrameworkVectorEntity
            {
                FrameworkId = publishedId, SourceRevision = "1", Model = "test-only",
                Dimensions = 2, ValuesJson = "[1,0]", IndexedAtUtc = DateTimeOffset.UtcNow
            });
            await database.SaveChangesAsync();
            if (failAudit)
            {
                await database.Database.ExecuteSqlRawAsync("ALTER TABLE dbo.MaintenanceAuditRecords ADD CONSTRAINT RejectTestAudit CHECK (Operation <> N'search-index-rebuild');");
            }

            var signingKey = Convert.ToBase64String(RandomNumberGenerator.GetBytes(32));
            using var factory = new WebApplicationFactory<Program>().WithWebHostBuilder(builder =>
            {
                builder.UseSetting("ConnectionStrings:Quarry", connection.ConnectionString);
                builder.UseSetting("Jwt:SigningKey", signingKey);
                builder.UseSetting("Jwt:Issuer", "Quarry");
                builder.UseSetting("Jwt:Audience", "Quarry.Maintenance");
            });
            using var client = factory.CreateClient();
            var anonymousResponse = await client.PostAsync("/api/maintenance/search-index/rebuild", null);
            Assert.Equal(HttpStatusCode.Unauthorized, anonymousResponse.StatusCode);
            Assert.Equal(1, await database.FrameworkVectors.CountAsync());
            Assert.Equal(0, await database.Database.SqlQueryRaw<int>("SELECT COUNT(*) AS [Value] FROM dbo.MaintenanceAuditRecords").SingleAsync());
            var token = new JwtSecurityToken("Quarry", "Quarry.Maintenance",
                [new Claim("sub", "sql-test-operator"), new Claim("permission", "maintenance")],
                expires: DateTime.UtcNow.AddMinutes(5),
                signingCredentials: new SigningCredentials(new SymmetricSecurityKey(Encoding.UTF8.GetBytes(signingKey)), SecurityAlgorithms.HmacSha256));
            client.DefaultRequestHeaders.Authorization = new("Bearer", new JwtSecurityTokenHandler().WriteToken(token));
            var response = await client.PostAsync("/api/maintenance/search-index/rebuild", null);

            Assert.Equal(failAudit ? HttpStatusCode.ServiceUnavailable : HttpStatusCode.Accepted, response.StatusCode);
            Assert.Equal(failAudit ? 1 : 0, await database.FrameworkVectors.CountAsync());
            Assert.Equal(failAudit ? 0 : 1, await database.Database.SqlQueryRaw<int>("SELECT COUNT(*) AS [Value] FROM dbo.MaintenanceAuditRecords").SingleAsync());
            Assert.Equal(failAudit ? 0 : 1, await database.Database.SqlQueryRaw<int>("SELECT COUNT(*) AS [Value] FROM dbo.IndexWorkItems").SingleAsync());
            if (!failAudit)
            {
                Assert.Equal("sql-test-operator", await database.Database.SqlQueryRaw<string>("SELECT ActorId AS [Value] FROM dbo.MaintenanceAuditRecords").SingleAsync());
                Assert.Equal("search-index-rebuild", await database.Database.SqlQueryRaw<string>("SELECT Operation AS [Value] FROM dbo.MaintenanceAuditRecords").SingleAsync());
                Assert.Equal("accepted", await database.Database.SqlQueryRaw<string>("SELECT Outcome AS [Value] FROM dbo.MaintenanceAuditRecords").SingleAsync());
                Assert.Equal(1, await database.Database.SqlQueryRaw<int>("SELECT InvalidatedVectorCount AS [Value] FROM dbo.MaintenanceAuditRecords").SingleAsync());
                Assert.False(string.IsNullOrWhiteSpace(await database.Database.SqlQueryRaw<string>("SELECT CorrelationId AS [Value] FROM dbo.MaintenanceAuditRecords").SingleAsync()));
                Assert.Equal(publishedId, await database.Database.SqlQueryRaw<Guid>("SELECT FrameworkId AS [Value] FROM dbo.IndexWorkItems").SingleAsync());
                var repeated = await client.PostAsync("/api/maintenance/search-index/rebuild", null);
                Assert.Equal(HttpStatusCode.Accepted, repeated.StatusCode);
                Assert.Equal(1, await database.Database.SqlQueryRaw<int>("SELECT COUNT(*) AS [Value] FROM dbo.IndexWorkItems").SingleAsync());
            }
            else
            {
                Assert.Contains("catalog_service_unavailable", await response.Content.ReadAsStringAsync());
            }
        }
        finally
        {
            await database.Database.EnsureDeletedAsync();
        }
    }
}
