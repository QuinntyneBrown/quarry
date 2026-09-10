// Acceptance Test
// Traces to: L2-003, L2-004, L2-008, L2-028, L2-034, L2-041
// Description: Withdrawal and deletion atomically remove discovery eligibility with revision checks and audit.
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using Quarry.Application.Recommendations;
using Quarry.Infrastructure.Persistence;
using Quarry.Infrastructure.Recommendations;

namespace Quarry.Api.AcceptanceTests;

public sealed class RetireFrameworkTests
{
    private static object Evidence(string revision) => new
    {
        expectedRevision = revision,
        evidence = new[]
        {
            new { targetType = "capability", targetId = "forms", kind = "documentation", source = "https://example.test/forms" },
            new { targetType = "component", targetId = "text-input", kind = "working-example", source = "https://example.test/text-input" }
        }
    };

    private static async Task<Guid> CreateAsync(HttpClient client, bool publish = true)
    {
        var id = Guid.NewGuid();
        Assert.Equal(HttpStatusCode.Created, (await client.PostAsJsonAsync("/api/maintenance/frameworks", SqlMaintenanceFixture.DraftBody(id))).StatusCode);
        if (publish) Assert.Equal(HttpStatusCode.OK, (await client.PostAsJsonAsync($"/api/maintenance/frameworks/{id}/publish", Evidence("1"))).StatusCode);
        return id;
    }

    private static Task<HttpResponseMessage> RetireAsync(HttpClient client, Guid id, string? revision, bool delete)
    {
        var request = new HttpRequestMessage(delete ? HttpMethod.Delete : HttpMethod.Post,
            $"/api/maintenance/frameworks/{id}" + (delete ? "" : "/withdraw"))
        { Content = JsonContent.Create(new { expectedRevision = revision }) };
        return client.SendAsync(request);
    }

    [SqlServerFact]
    public async Task RetiringPublishedEntriesHidesDetailsBrowseAndSearchDespiteOldVectors()
    {
        foreach (var delete in new[] { false, true })
        {
            await using var fixture = await SqlMaintenanceFixture.CreateAsync();
            using var client = fixture.CreateClient();
            var id = await CreateAsync(client);
            await using var database = fixture.CreateContext();
            database.FrameworkVectors.Add(new FrameworkVectorEntity
            {
                FrameworkId = id, SourceRevision = "2", Model = "test-model", Dimensions = 2,
                ValuesJson = "[1,0]", IndexedAtUtc = DateTimeOffset.UtcNow
            });
            await database.SaveChangesAsync();
            using var publicFactory = fixture.Factory.WithWebHostBuilder(builder => builder.ConfigureTestServices(services =>
                services.AddScoped<ITextEmbeddingProvider, SearchTestEmbeddingProvider>()));
            using var anonymous = publicFactory.CreateClient();
            using var before = JsonDocument.Parse(await (await anonymous.PostAsJsonAsync("/api/framework-searches", new { query = "staff forms" })).Content.ReadAsStringAsync());
            Assert.Single(before.RootElement.GetProperty("items").EnumerateArray());

            var response = await RetireAsync(client, id, "2", delete);
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            using var result = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
            Assert.Equal("3", result.RootElement.GetProperty("revision").GetString());
            Assert.Equal("2", result.RootElement.GetProperty("catalogRevision").GetString());
            Assert.Equal(delete ? "deleted" : "withdrawn", result.RootElement.GetProperty("status").GetString());
            Assert.Equal(HttpStatusCode.NotFound, (await anonymous.GetAsync($"/api/frameworks/{id}")).StatusCode);
            using var page = JsonDocument.Parse(await anonymous.GetStringAsync("/api/frameworks"));
            Assert.Empty(page.RootElement.GetProperty("items").EnumerateArray());
            Assert.Equal("2", page.RootElement.GetProperty("catalogRevision").GetString());
            using var search = JsonDocument.Parse(await (await anonymous.PostAsJsonAsync("/api/framework-searches", new { query = "staff forms" })).Content.ReadAsStringAsync());
            Assert.Empty(search.RootElement.GetProperty("items").EnumerateArray());
            Assert.False(search.RootElement.GetProperty("isIndexIncomplete").GetBoolean());
            Assert.Equal(1, await database.FrameworkVectors.CountAsync());
            Assert.Equal(1, await database.PublishedFrameworkSnapshots.CountAsync());
            var audit = await database.MaintenanceAuditRecords.SingleAsync(item => item.Operation == (delete ? "framework-delete" : "framework-withdraw"));
            Assert.Equal(id, audit.TargetId); Assert.Equal("3", audit.SourceRevision);
            Assert.Equal("metadata-test-operator", audit.ActorId); Assert.Equal("accepted", audit.Outcome);
        }
    }

    [SqlServerFact]
    public async Task WithdrawnDraftCanBeRepublishedButDeletedIdentityCannotBeReused()
    {
        await using var fixture = await SqlMaintenanceFixture.CreateAsync();
        using var client = fixture.CreateClient();
        var id = await CreateAsync(client);
        Assert.Equal(HttpStatusCode.OK, (await RetireAsync(client, id, "2", false)).StatusCode);
        Assert.Equal(HttpStatusCode.Conflict, (await RetireAsync(client, id, "3", false)).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync($"/api/maintenance/frameworks/{id}")).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await client.PostAsJsonAsync($"/api/maintenance/frameworks/{id}/publish", Evidence("3"))).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await RetireAsync(client, id, "4", true)).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await client.GetAsync($"/api/maintenance/frameworks/{id}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await client.PostAsJsonAsync($"/api/maintenance/frameworks/{id}/publish", Evidence("5"))).StatusCode);
        var metadata = SqlMaintenanceFixture.DraftBody(id); metadata.Remove("id");
        Assert.Equal(HttpStatusCode.NotFound, (await client.PutAsJsonAsync($"/api/maintenance/frameworks/{id}", new { expectedRevision = "5", metadata })).StatusCode);
        Assert.Equal(HttpStatusCode.Conflict, (await client.PostAsJsonAsync("/api/maintenance/frameworks", SqlMaintenanceFixture.DraftBody(id))).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await RetireAsync(client, id, "5", true)).StatusCode);
        await using var database = fixture.CreateContext();
        Assert.Equal(2, await database.PublishedFrameworkSnapshots.CountAsync());
    }

    [SqlServerFact]
    public async Task PrivateDraftDeletionDoesNotChangeThePublicCatalogRevision()
    {
        await using var fixture = await SqlMaintenanceFixture.CreateAsync();
        using var client = fixture.CreateClient();
        var id = await CreateAsync(client, false);
        Assert.Equal(HttpStatusCode.Conflict, (await RetireAsync(client, id, "1", false)).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await RetireAsync(client, id, "1", true)).StatusCode);
        await using var database = fixture.CreateContext();
        Assert.Equal(0, (await database.CatalogState.SingleAsync()).Revision);
        Assert.Empty(await database.IndexWorkItems.ToListAsync());
    }

    [SqlServerFact]
    public async Task InvalidStaleUnknownAndUnauthorizedRetirementPreservesPublication()
    {
        foreach (var delete in new[] { false, true })
        {
            await using var fixture = await SqlMaintenanceFixture.CreateAsync();
            using var client = fixture.CreateClient();
            var id = await CreateAsync(client);
            Assert.Equal(HttpStatusCode.BadRequest, (await RetireAsync(client, id, null, delete)).StatusCode);
            Assert.Equal(HttpStatusCode.BadRequest, (await RetireAsync(client, id, "02", delete)).StatusCode);
            Assert.Equal(HttpStatusCode.Conflict, (await RetireAsync(client, id, "1", delete)).StatusCode);
            Assert.Equal(HttpStatusCode.NotFound, (await RetireAsync(client, Guid.NewGuid(), "2", delete)).StatusCode);
            using var anonymous = fixture.CreateClient(authenticated: false);
            using var denied = fixture.CreateClient(permission: false);
            Assert.Equal(HttpStatusCode.Unauthorized, (await RetireAsync(anonymous, id, "2", delete)).StatusCode);
            Assert.Equal(HttpStatusCode.Forbidden, (await RetireAsync(denied, id, "2", delete)).StatusCode);
            Assert.Equal(HttpStatusCode.OK, (await anonymous.GetAsync($"/api/frameworks/{id}")).StatusCode);
            await using var database = fixture.CreateContext();
            Assert.Equal(2, await database.MaintenanceAuditRecords.CountAsync());
            Assert.Equal("2", (await database.FrameworkDrafts.SingleAsync()).Revision);
        }
    }

    [SqlServerFact]
    public async Task AuditFailureRollsBackWithdrawalAndDeletion()
    {
        foreach (var delete in new[] { false, true })
        {
            await using var fixture = await SqlMaintenanceFixture.CreateAsync();
            using var client = fixture.CreateClient();
            var id = await CreateAsync(client);
            await using var database = fixture.CreateContext();
            await database.Database.ExecuteSqlRawAsync("ALTER TABLE MaintenanceAuditRecords ADD CONSTRAINT RejectRetirement CHECK (Operation NOT IN ('framework-withdraw', 'framework-delete'));");
            Assert.Equal(HttpStatusCode.ServiceUnavailable, (await RetireAsync(client, id, "2", delete)).StatusCode);
            Assert.Equal(HttpStatusCode.OK, (await client.GetAsync($"/api/frameworks/{id}")).StatusCode);
            Assert.Equal(HttpStatusCode.OK, (await client.GetAsync($"/api/maintenance/frameworks/{id}")).StatusCode);
            Assert.Equal("2", (await database.FrameworkDrafts.SingleAsync()).Revision);
            Assert.Equal(1, (await database.CatalogState.SingleAsync()).Revision);
            Assert.Equal("pending", (await database.IndexWorkItems.SingleAsync()).State);
        }
    }

    [SqlServerFact]
    public async Task IndexWorkFinishingAfterRetirementCannotRestoreSearchEligibility()
    {
        foreach (var delete in new[] { false, true })
        {
            await using var fixture = await SqlMaintenanceFixture.CreateAsync();
            using var client = fixture.CreateClient();
            var id = await CreateAsync(client);
            await using var database = fixture.CreateContext();
            var repository = new SqlIndexWorkRepository(database);
            var modelKey = new OllamaEmbeddingOptions().CompatibilityKey;
            var lease = await repository.ClaimAsync(modelKey, CancellationToken.None);
            Assert.NotNull(lease);
            Assert.Equal(HttpStatusCode.OK, (await RetireAsync(client, id, "2", delete)).StatusCode);
            Assert.False(await repository.CompleteAsync(lease, new TextEmbedding(modelKey, [1f, 0f]), CancellationToken.None));
            Assert.Empty(await database.FrameworkVectors.ToListAsync());
            Assert.Equal("superseded", (await database.IndexWorkItems.SingleAsync()).State);
        }
    }

    [SqlServerFact]
    public async Task ConcurrentWithdrawalAndDeletionAcceptOnlyOneExpectedRevision()
    {
        await using var fixture = await SqlMaintenanceFixture.CreateAsync();
        using var client = fixture.CreateClient();
        var id = await CreateAsync(client);
        var results = await Task.WhenAll(RetireAsync(client, id, "2", false), RetireAsync(client, id, "2", true));
        Assert.Single(results, item => item.StatusCode == HttpStatusCode.OK);
        Assert.Single(results, item => item.StatusCode is HttpStatusCode.NotFound or HttpStatusCode.Conflict);
        await using var database = fixture.CreateContext();
        Assert.Equal(2, (await database.CatalogState.SingleAsync()).Revision);
        Assert.Equal(3, await database.MaintenanceAuditRecords.CountAsync());
    }
}
