// Acceptance Test
// Traces to: L2-003, L2-004, L2-028, L2-034, L2-041
// Description: Operator-created drafts are validated, private, durable and transactionally audited.
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;

namespace Quarry.Api.AcceptanceTests;

public sealed class CreateFrameworkDraftTests
{
    [SqlServerFact]
    public async Task OperatorCreatesAnAuditedPrivateDraftWithDerivedComponentCount()
    {
        await using var fixture = await SqlMaintenanceFixture.CreateAsync();
        using var client = fixture.CreateClient();
        var id = Guid.NewGuid();
        var body = SqlMaintenanceFixture.DraftBody(id);
        body["componentCount"] = 999;
        var response = await client.PostAsJsonAsync("/api/maintenance/frameworks", body);
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        using var created = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        Assert.Equal(id, created.RootElement.GetProperty("id").GetGuid());
        Assert.Equal("1", created.RootElement.GetProperty("revision").GetString());
        Assert.Equal(1, created.RootElement.GetProperty("componentCount").GetInt32());
        Assert.Equal("draft", created.RootElement.GetProperty("status").GetString());
        using var reopened = fixture.CreateClient();
        using var persisted = JsonDocument.Parse(await reopened.GetStringAsync(response.Headers.Location));
        Assert.Equal("Fixture framework", persisted.RootElement.GetProperty("metadata").GetProperty("name").GetString());
        using var anonymous = fixture.CreateClient(authenticated: false);
        Assert.Equal(HttpStatusCode.NotFound, (await anonymous.GetAsync($"/api/frameworks/{id:D}")).StatusCode);
        using var page = JsonDocument.Parse(await anonymous.GetStringAsync("/api/frameworks"));
        Assert.Empty(page.RootElement.GetProperty("items").EnumerateArray());
        await using var database = fixture.CreateContext();
        Assert.Empty(await database.IndexWorkItems.ToListAsync());
        var audit = await database.MaintenanceAuditRecords.SingleAsync();
        Assert.Equal("metadata-test-operator", audit.ActorId);
        Assert.Equal("framework-create", audit.Operation);
        Assert.Equal(id, await database.Database.SqlQueryRaw<Guid>("SELECT TargetId AS [Value] FROM MaintenanceAuditRecords").SingleAsync());
        Assert.Equal("1", await database.Database.SqlQueryRaw<string>("SELECT SourceRevision AS [Value] FROM MaintenanceAuditRecords").SingleAsync());
    }

    [SqlServerFact]
    public async Task UnauthorizedRequestsDoNotCreateDrafts()
    {
        await using var fixture = await SqlMaintenanceFixture.CreateAsync();
        using var anonymous = fixture.CreateClient(authenticated: false);
        using var denied = fixture.CreateClient(permission: false);
        var body = SqlMaintenanceFixture.DraftBody(Guid.NewGuid());
        Assert.Equal(HttpStatusCode.Unauthorized, (await anonymous.PostAsJsonAsync("/api/maintenance/frameworks", body)).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await denied.PostAsJsonAsync("/api/maintenance/frameworks", body)).StatusCode);
        await using var database = fixture.CreateContext();
        Assert.Empty(await database.MaintenanceAuditRecords.ToListAsync());
        Assert.Empty(await database.FrameworkDrafts.ToListAsync());
    }

    [SqlServerFact]
    public async Task InvalidFieldsAreReportedWithoutPersistingMetadata()
    {
        await using var fixture = await SqlMaintenanceFixture.CreateAsync();
        using var client = fixture.CreateClient();
        var body = SqlMaintenanceFixture.DraftBody(Guid.NewGuid());
        body["name"] = " "; body["technology"] = "Unsupported"; body["tags"] = new System.Text.Json.Nodes.JsonArray();
        body["capabilities"] = null; body["useCases"] = new System.Text.Json.Nodes.JsonArray();
        var response = await client.PostAsJsonAsync("/api/maintenance/frameworks", body);
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        using var error = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        var fields = error.RootElement.GetProperty("errors");
        foreach (var field in new[] { "name", "technology", "tags", "capabilities", "useCases" }) Assert.True(fields.TryGetProperty(field, out _));
        await using var database = fixture.CreateContext();
        Assert.Empty(await database.MaintenanceAuditRecords.ToListAsync());
        Assert.Empty(await database.FrameworkDrafts.ToListAsync());
    }

    [SqlServerFact]
    public async Task InvalidDesignSystemUriIsRejectedWithoutPersistingMetadata()
    {
        // Extends L2-003's metadata-validation coverage for a framework's optional whole-app
        // design-system iframe URL; no dedicated L2 ID exists yet.
        await using var fixture = await SqlMaintenanceFixture.CreateAsync();
        using var client = fixture.CreateClient();
        var body = SqlMaintenanceFixture.DraftBody(Guid.NewGuid());
        body["designSystemUri"] = "ftp://example.test/design-systems/cornerstone/";
        var response = await client.PostAsJsonAsync("/api/maintenance/frameworks", body);
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        using var error = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        Assert.True(error.RootElement.GetProperty("errors").TryGetProperty("designSystemUri", out _));
        await using var database = fixture.CreateContext();
        Assert.Empty(await database.FrameworkDrafts.ToListAsync());
    }

    [SqlServerFact]
    public async Task ConcurrentCreatesForOneIdentityProduceOneDraftAndOneAudit()
    {
        await using var fixture = await SqlMaintenanceFixture.CreateAsync();
        using var client = fixture.CreateClient();
        var id = Guid.NewGuid();
        var responses = await Task.WhenAll(
            client.PostAsJsonAsync("/api/maintenance/frameworks", SqlMaintenanceFixture.DraftBody(id)),
            client.PostAsJsonAsync("/api/maintenance/frameworks", SqlMaintenanceFixture.DraftBody(id)));
        Assert.Single(responses, response => response.StatusCode == HttpStatusCode.Created);
        Assert.Single(responses, response => response.StatusCode == HttpStatusCode.Conflict);
        await using var database = fixture.CreateContext();
        Assert.Equal(1, await database.FrameworkDrafts.CountAsync());
        Assert.Equal(1, await database.MaintenanceAuditRecords.CountAsync());
    }

    [SqlServerFact]
    public async Task DuplicateIdentityIsRejectedAndAuditFailureLeavesNoDraft()
    {
        await using var fixture = await SqlMaintenanceFixture.CreateAsync();
        using var client = fixture.CreateClient();
        var id = Guid.NewGuid();
        var body = SqlMaintenanceFixture.DraftBody(id);
        Assert.Equal(HttpStatusCode.Created, (await client.PostAsJsonAsync("/api/maintenance/frameworks", body)).StatusCode);
        Assert.Equal(HttpStatusCode.Conflict, (await client.PostAsJsonAsync("/api/maintenance/frameworks", body)).StatusCode);
        await using var database = fixture.CreateContext();
        await database.Database.ExecuteSqlRawAsync("ALTER TABLE MaintenanceAuditRecords WITH NOCHECK ADD CONSTRAINT RejectCreateAudit CHECK (Operation <> N'framework-create');");
        var secondId = Guid.NewGuid();
        var failed = await client.PostAsJsonAsync("/api/maintenance/frameworks", SqlMaintenanceFixture.DraftBody(secondId));
        Assert.Equal(HttpStatusCode.ServiceUnavailable, failed.StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await client.GetAsync($"/api/maintenance/frameworks/{secondId:D}")).StatusCode);
        Assert.Equal(1, await database.MaintenanceAuditRecords.CountAsync());
    }
}
