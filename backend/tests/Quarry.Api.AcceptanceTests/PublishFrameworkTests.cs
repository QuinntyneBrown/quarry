// Acceptance Test
// Traces to: L2-003, L2-004, L2-008, L2-028, L2-034, L2-041
// Description: Evidence-backed publication atomically exposes a snapshot and schedules indexing.
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Nodes;
using Microsoft.EntityFrameworkCore;
using System.Data.Common;

namespace Quarry.Api.AcceptanceTests;

public sealed class PublishFrameworkTests
{
    private static JsonObject PublishBody(string revision) => new()
    {
        ["expectedRevision"] = revision,
        ["evidence"] = new JsonArray(
            new JsonObject { ["targetType"] = "capability", ["targetId"] = "forms", ["kind"] = "documentation", ["source"] = "https://example.test/framework/docs/forms" },
            new JsonObject { ["targetType"] = "component", ["targetId"] = "text-input", ["kind"] = "working-example", ["source"] = "https://example.test/framework/examples/text-input" })
    };

    private static async Task<Guid> CreateAsync(HttpClient client)
    {
        var id = Guid.NewGuid();
        Assert.Equal(HttpStatusCode.Created, (await client.PostAsJsonAsync("/api/maintenance/frameworks", SqlMaintenanceFixture.DraftBody(id))).StatusCode);
        return id;
    }

    [SqlServerFact]
    public async Task PublicationExposesMatchingMetadataAndPersistsIndexWorkAuditAndHistory()
    {
        await using var fixture = await SqlMaintenanceFixture.CreateAsync();
        using var client = fixture.CreateClient();
        var id = await CreateAsync(client);
        var response = await client.PostAsJsonAsync($"/api/maintenance/frameworks/{id:D}/publish", PublishBody("1"));
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        using var published = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        Assert.Equal("2", published.RootElement.GetProperty("revision").GetString());
        using var anonymous = fixture.CreateClient(authenticated: false);
        using var details = JsonDocument.Parse(await anonymous.GetStringAsync($"/api/frameworks/{id:D}"));
        Assert.Equal("2", details.RootElement.GetProperty("summary").GetProperty("revision").GetString());
        Assert.Equal(1, details.RootElement.GetProperty("summary").GetProperty("componentCount").GetInt32());
        using var page = JsonDocument.Parse(await anonymous.GetStringAsync("/api/frameworks"));
        Assert.Equal("1", page.RootElement.GetProperty("catalogRevision").GetString());
        Assert.Equal(id, page.RootElement.GetProperty("items")[0].GetProperty("id").GetGuid());
        await using var database = fixture.CreateContext();
        var work = await database.IndexWorkItems.SingleAsync();
        Assert.Equal(id, work.FrameworkId); Assert.Equal("2", work.SourceRevision); Assert.Equal("pending", work.State);
        var audit = await database.MaintenanceAuditRecords.SingleAsync(item => item.Operation == "framework-publish");
        Assert.Equal(id, audit.TargetId); Assert.Equal("2", audit.SourceRevision);
        Assert.Equal(1, await database.Database.SqlQueryRaw<int>("SELECT COUNT(*) AS [Value] FROM PublishedFrameworkSnapshots").SingleAsync());
        var evidence = await database.Database.SqlQueryRaw<string>("SELECT EvidenceJson AS [Value] FROM PublishedFrameworkSnapshots").SingleAsync();
        Assert.Contains("forms", evidence); Assert.Contains("text-input", evidence);
        Assert.Equal(HttpStatusCode.Conflict, (await client.PostAsJsonAsync($"/api/maintenance/frameworks/{id:D}/publish", PublishBody("1"))).StatusCode);
    }

    [SqlServerFact]
    public async Task EditingAndRepublishingKeepsTheOriginalPublishedSnapshot()
    {
        await using var fixture = await SqlMaintenanceFixture.CreateAsync();
        using var client = fixture.CreateClient();
        var id = await CreateAsync(client);
        Assert.Equal(HttpStatusCode.OK, (await client.PostAsJsonAsync($"/api/maintenance/frameworks/{id:D}/publish", PublishBody("1"))).StatusCode);
        var metadata = SqlMaintenanceFixture.DraftBody(id); metadata.Remove("id"); metadata["name"] = "New published name";
        Assert.Equal(HttpStatusCode.OK, (await client.PutAsJsonAsync($"/api/maintenance/frameworks/{id:D}", new JsonObject { ["expectedRevision"] = "2", ["metadata"] = metadata })).StatusCode);
        using var before = JsonDocument.Parse(await client.GetStringAsync($"/api/frameworks/{id:D}"));
        Assert.Equal("Fixture framework", before.RootElement.GetProperty("summary").GetProperty("name").GetString());
        Assert.Equal(HttpStatusCode.OK, (await client.PostAsJsonAsync($"/api/maintenance/frameworks/{id:D}/publish", PublishBody("3"))).StatusCode);
        await using var database = fixture.CreateContext();
        Assert.Equal("4", (await database.FrameworkRevisions.SingleAsync()).Revision);
        Assert.Equal(2, await database.Database.SqlQueryRaw<int>("SELECT COUNT(*) AS [Value] FROM PublishedFrameworkSnapshots").SingleAsync());
        var original = await database.Database.SqlQueryRaw<string>("SELECT MetadataJson AS [Value] FROM PublishedFrameworkSnapshots WHERE Revision = '2'").SingleAsync();
        Assert.Contains("Fixture framework", original); Assert.DoesNotContain("New published name", original);
        await Assert.ThrowsAnyAsync<DbException>(() => database.Database.ExecuteSqlRawAsync("UPDATE PublishedFrameworkSnapshots SET MetadataJson = N'{{}}';"));
        await Assert.ThrowsAnyAsync<DbException>(() => database.Database.ExecuteSqlRawAsync("DELETE FROM PublishedFrameworkSnapshots;"));
    }

    [SqlServerFact]
    public async Task IncompleteEvidenceAndUnauthorizedPublicationLeaveTheDraftPrivate()
    {
        await using var fixture = await SqlMaintenanceFixture.CreateAsync();
        using var client = fixture.CreateClient();
        var id = await CreateAsync(client);
        var body = PublishBody("1"); body["evidence"]!.AsArray().RemoveAt(1);
        var invalid = await client.PostAsJsonAsync($"/api/maintenance/frameworks/{id:D}/publish", body);
        Assert.Equal(HttpStatusCode.BadRequest, invalid.StatusCode);
        Assert.Contains("evidence", await invalid.Content.ReadAsStringAsync());
        using var anonymous = fixture.CreateClient(authenticated: false);
        using var denied = fixture.CreateClient(permission: false);
        Assert.Equal(HttpStatusCode.Unauthorized, (await anonymous.PostAsJsonAsync($"/api/maintenance/frameworks/{id:D}/publish", PublishBody("1"))).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await denied.PostAsJsonAsync($"/api/maintenance/frameworks/{id:D}/publish", PublishBody("1"))).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await anonymous.GetAsync($"/api/frameworks/{id:D}")).StatusCode);
        await using var database = fixture.CreateContext();
        Assert.Empty(await database.IndexWorkItems.ToListAsync());
        Assert.Equal("1", (await database.FrameworkDrafts.SingleAsync()).Revision);
        Assert.Equal(1, await database.MaintenanceAuditRecords.CountAsync());
    }

    [SqlServerFact]
    public async Task AuditFailureRollsBackPublicationCatalogRevisionHistoryAndWork()
    {
        await using var fixture = await SqlMaintenanceFixture.CreateAsync();
        using var client = fixture.CreateClient();
        var id = await CreateAsync(client);
        await using var database = fixture.CreateContext();
        await database.Database.ExecuteSqlRawAsync("ALTER TABLE MaintenanceAuditRecords ADD CONSTRAINT RejectPublishAudit CHECK (Operation <> N'framework-publish');");
        Assert.Equal(HttpStatusCode.ServiceUnavailable, (await client.PostAsJsonAsync($"/api/maintenance/frameworks/{id:D}/publish", PublishBody("1"))).StatusCode);
        Assert.Empty(await database.FrameworkRevisions.ToListAsync());
        Assert.Empty(await database.IndexWorkItems.ToListAsync());
        Assert.Equal("1", (await database.FrameworkDrafts.SingleAsync()).Revision);
        Assert.Equal(0, await database.Database.SqlQueryRaw<int>("SELECT COUNT(*) AS [Value] FROM PublishedFrameworkSnapshots").SingleAsync());
        using var page = JsonDocument.Parse(await client.GetStringAsync("/api/frameworks"));
        Assert.Equal("0", page.RootElement.GetProperty("catalogRevision").GetString());
    }

    [SqlServerFact]
    public async Task SchedulingFailureRollsBackAlreadySavedPublicationAndAudit()
    {
        await using var fixture = await SqlMaintenanceFixture.CreateAsync();
        using var client = fixture.CreateClient();
        var id = await CreateAsync(client);
        await using var database = fixture.CreateContext();
        await database.Database.ExecuteSqlRawAsync("ALTER TABLE IndexWorkItems ADD CONSTRAINT RejectPublishWork CHECK (State <> N'pending');");
        Assert.Equal(HttpStatusCode.ServiceUnavailable, (await client.PostAsJsonAsync($"/api/maintenance/frameworks/{id:D}/publish", PublishBody("1"))).StatusCode);
        Assert.Empty(await database.FrameworkRevisions.ToListAsync());
        Assert.Empty(await database.PublishedFrameworkSnapshots.ToListAsync());
        Assert.Empty(await database.IndexWorkItems.ToListAsync());
        Assert.Equal(1, await database.MaintenanceAuditRecords.CountAsync());
        Assert.Equal("1", (await database.FrameworkDrafts.SingleAsync()).Revision);
        Assert.Equal(0, (await database.CatalogState.SingleAsync()).Revision);
    }

    [SqlServerFact]
    public async Task ConcurrentPublicationAcceptsOneExpectedRevision()
    {
        await using var fixture = await SqlMaintenanceFixture.CreateAsync();
        using var client = fixture.CreateClient();
        var id = await CreateAsync(client);
        var results = await Task.WhenAll(client.PostAsJsonAsync($"/api/maintenance/frameworks/{id:D}/publish", PublishBody("1")),
            client.PostAsJsonAsync($"/api/maintenance/frameworks/{id:D}/publish", PublishBody("1")));
        Assert.Single(results, response => response.StatusCode == HttpStatusCode.OK);
        Assert.Single(results, response => response.StatusCode == HttpStatusCode.Conflict);
        await using var database = fixture.CreateContext();
        Assert.Equal(1, await database.PublishedFrameworkSnapshots.CountAsync());
        Assert.Equal(1, await database.IndexWorkItems.CountAsync());
        Assert.Equal(1, (await database.CatalogState.SingleAsync()).Revision);
    }
}
