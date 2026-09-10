// Acceptance Test
// Traces to: L2-003, L2-008, L2-028, L2-034, L2-041
// Description: Draft revisions use optimistic concurrency and atomic audit without altering published data.
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Nodes;
using Microsoft.EntityFrameworkCore;
using Quarry.Infrastructure.Persistence;

namespace Quarry.Api.AcceptanceTests;

public sealed class UpdateFrameworkDraftTests
{
    private static JsonObject UpdateBody(Guid id, string revision, string name = "Updated draft")
    {
        var metadata = SqlMaintenanceFixture.DraftBody(id);
        metadata.Remove("id");
        metadata["name"] = name;
        return new JsonObject { ["expectedRevision"] = revision, ["metadata"] = metadata };
    }

    private static async Task<Guid> CreateAsync(HttpClient client)
    {
        var id = Guid.NewGuid();
        Assert.Equal(HttpStatusCode.Created, (await client.PostAsJsonAsync("/api/maintenance/frameworks", SqlMaintenanceFixture.DraftBody(id))).StatusCode);
        return id;
    }

    [SqlServerFact]
    public async Task UpdateAdvancesDraftRevisionWithoutChangingPublishedMetadata()
    {
        await using var fixture = await SqlMaintenanceFixture.CreateAsync();
        using var client = fixture.CreateClient();
        var id = await CreateAsync(client);
        await using var database = fixture.CreateContext();
        database.FrameworkRevisions.Add(new FrameworkRevisionEntity
        {
            Id = id, Name = "Published name", Description = "Published description", Technology = "React", Revision = "1", IsPublished = true
        });
        await database.SaveChangesAsync();
        var response = await client.PutAsJsonAsync($"/api/maintenance/frameworks/{id:D}", UpdateBody(id, "1"));
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        using var updated = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        Assert.Equal("2", updated.RootElement.GetProperty("revision").GetString());
        Assert.Equal("Updated draft", updated.RootElement.GetProperty("metadata").GetProperty("name").GetString());
        using var reloaded = fixture.CreateClient();
        using var persisted = JsonDocument.Parse(await reloaded.GetStringAsync($"/api/maintenance/frameworks/{id:D}"));
        Assert.Equal("2", persisted.RootElement.GetProperty("revision").GetString());
        Assert.Equal("Published name", (await database.FrameworkRevisions.AsNoTracking().SingleAsync()).Name);
        Assert.Empty(await database.IndexWorkItems.ToListAsync());
        var audit = await database.MaintenanceAuditRecords.SingleAsync(item => item.Operation == "framework-update");
        Assert.Equal(id, audit.TargetId);
        Assert.Equal("2", audit.SourceRevision);
        Assert.Equal("metadata-test-operator", audit.ActorId);
    }

    [SqlServerFact]
    public async Task CompetingUpdatesAcceptOnlyOneExpectedRevision()
    {
        await using var fixture = await SqlMaintenanceFixture.CreateAsync();
        using var client = fixture.CreateClient();
        var id = await CreateAsync(client);
        var responses = await Task.WhenAll(client.PutAsJsonAsync($"/api/maintenance/frameworks/{id:D}", UpdateBody(id, "1", "First")),
            client.PutAsJsonAsync($"/api/maintenance/frameworks/{id:D}", UpdateBody(id, "1", "Second")));
        Assert.Single(responses, response => response.StatusCode == HttpStatusCode.OK);
        var conflict = Assert.Single(responses, response => response.StatusCode == HttpStatusCode.Conflict);
        Assert.Contains("revision_conflict", await conflict.Content.ReadAsStringAsync());
        await using var database = fixture.CreateContext();
        Assert.Equal("2", (await database.FrameworkDrafts.SingleAsync()).Revision);
        Assert.Equal(2, await database.MaintenanceAuditRecords.CountAsync());
    }

    [SqlServerFact]
    public async Task InvalidAndUnknownUpdatesDoNotModifyExistingDrafts()
    {
        await using var fixture = await SqlMaintenanceFixture.CreateAsync();
        using var client = fixture.CreateClient();
        var id = await CreateAsync(client);
        foreach (var revision in new[] { "", "01", "0", "-1", "1.5", new string('9', 31) })
        {
            var response = await client.PutAsJsonAsync($"/api/maintenance/frameworks/{id:D}", UpdateBody(id, revision));
            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
            Assert.Contains("expectedRevision", await response.Content.ReadAsStringAsync());
        }
        Assert.Equal(HttpStatusCode.BadRequest, (await client.PutAsJsonAsync($"/api/maintenance/frameworks/{id:D}", UpdateBody(id, "1", " "))).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await client.PutAsJsonAsync($"/api/maintenance/frameworks/{Guid.NewGuid():D}", UpdateBody(id, "1"))).StatusCode);
        await using var database = fixture.CreateContext();
        Assert.Equal("1", (await database.FrameworkDrafts.SingleAsync()).Revision);
        Assert.Equal(1, await database.MaintenanceAuditRecords.CountAsync());
    }

    [SqlServerFact]
    public async Task AuditFailureRollsBackDraftUpdate()
    {
        await using var fixture = await SqlMaintenanceFixture.CreateAsync();
        using var client = fixture.CreateClient();
        var id = await CreateAsync(client);
        await using var database = fixture.CreateContext();
        await database.Database.ExecuteSqlRawAsync("ALTER TABLE MaintenanceAuditRecords ADD CONSTRAINT RejectUpdateAudit CHECK (Operation <> N'framework-update');");
        var response = await client.PutAsJsonAsync($"/api/maintenance/frameworks/{id:D}", UpdateBody(id, "1"));
        Assert.Equal(HttpStatusCode.ServiceUnavailable, response.StatusCode);
        Assert.Equal("1", (await database.FrameworkDrafts.SingleAsync()).Revision);
        Assert.Equal(1, await database.MaintenanceAuditRecords.CountAsync());
    }

    [SqlServerFact]
    public async Task UpdateAndReadRequireMaintenancePermission()
    {
        await using var fixture = await SqlMaintenanceFixture.CreateAsync();
        using var client = fixture.CreateClient();
        var id = await CreateAsync(client);
        using var anonymous = fixture.CreateClient(authenticated: false);
        using var forbidden = fixture.CreateClient(permission: false);
        var route = $"/api/maintenance/frameworks/{id:D}";
        Assert.Equal(HttpStatusCode.Unauthorized, (await anonymous.PutAsJsonAsync(route, UpdateBody(id, "1"))).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await forbidden.PutAsJsonAsync(route, UpdateBody(id, "1"))).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await anonymous.GetAsync(route)).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await forbidden.GetAsync(route)).StatusCode);
        await using var database = fixture.CreateContext();
        Assert.Equal("1", (await database.FrameworkDrafts.SingleAsync()).Revision);
    }
}
