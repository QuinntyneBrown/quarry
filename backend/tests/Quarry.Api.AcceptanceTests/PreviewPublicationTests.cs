// Acceptance Test
// Traces to: L2-003, L2-004, L2-016, L2-029, L2-030, L2-041
// Description: Published preview manifests remain bound to the evidenced metadata revision.
using System.Net;
using System.Net.Http.Json;
using System.Text.Json.Nodes;
using Microsoft.EntityFrameworkCore;

namespace Quarry.Api.AcceptanceTests;

public sealed class PreviewPublicationTests
{
    private static JsonObject Preview(string build = "illustrative-v1") => new()
    {
        ["previewUri"] = $"http://localhost:4180/bundles/{build}/index.html",
        ["componentIds"] = new JsonArray("text-input"), ["buildId"] = build,
        ["protocolVersion"] = 1, ["isIllustrative"] = true
    };

    private static JsonObject Publication(string revision) => new()
    {
        ["expectedRevision"] = revision,
        ["evidence"] = new JsonArray(
            new JsonObject { ["targetType"] = "capability", ["targetId"] = "forms", ["kind"] = "documentation", ["source"] = "https://example.test/docs/forms" },
            new JsonObject { ["targetType"] = "component", ["targetId"] = "text-input", ["kind"] = "working-example", ["source"] = "https://example.test/examples/text-input" })
    };

    private static async Task<JsonNode> Details(HttpClient client, Guid id)
        => JsonNode.Parse(await client.GetStringAsync($"/api/frameworks/{id:D}"))!;

    [SqlServerFact]
    public async Task PublicationBindsPreviewToRevisionAndDraftChangesStayPrivate()
    {
        await using var fixture = await SqlMaintenanceFixture.CreateAsync();
        using var client = fixture.CreateClient();
        using var reader = fixture.CreateClient(authenticated: false);
        var id = Guid.NewGuid();
        var metadata = SqlMaintenanceFixture.DraftBody(id);
        metadata["preview"] = Preview();
        Assert.Equal(HttpStatusCode.Created, (await client.PostAsJsonAsync("/api/maintenance/frameworks", metadata)).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await reader.GetAsync($"/api/frameworks/{id:D}")).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await client.PostAsJsonAsync($"/api/maintenance/frameworks/{id:D}/publish", Publication("1"))).StatusCode);
        var details = await Details(reader, id);
        Assert.NotNull(details["previewManifest"]);
        Assert.Equal(id.ToString("D"), details["previewManifest"]!["frameworkId"]!.GetValue<string>());
        Assert.Equal("2", details["previewManifest"]!["revision"]!.GetValue<string>());
        Assert.Equal("illustrative-v1", details["previewManifest"]!["buildId"]!.GetValue<string>());
        Assert.True(details["previewManifest"]!["isIllustrative"]!.GetValue<bool>());
        Assert.Equal("text-input", details["previewManifest"]!["componentIds"]![0]!.GetValue<string>());
        Assert.Equal(1, details["previewManifest"]!["protocolVersion"]!.GetValue<int>());
        Assert.Equal(Preview()["previewUri"]!.GetValue<string>(), details["previewManifest"]!["previewUri"]!.GetValue<string>());

        metadata.Remove("id"); metadata["preview"] = Preview("illustrative-v2");
        Assert.Equal(HttpStatusCode.OK, (await client.PutAsJsonAsync($"/api/maintenance/frameworks/{id:D}", new JsonObject { ["expectedRevision"] = "2", ["metadata"] = metadata.DeepClone() })).StatusCode);
        Assert.True(JsonNode.DeepEquals(details, await Details(reader, id)));
        Assert.Equal(HttpStatusCode.OK, (await client.PostAsJsonAsync($"/api/maintenance/frameworks/{id:D}/publish", Publication("3"))).StatusCode);
        var revised = await Details(reader, id);
        Assert.Equal("4", revised["summary"]!["revision"]!.GetValue<string>());
        Assert.Equal("4", revised["previewManifest"]!["revision"]!.GetValue<string>());
        Assert.Equal("illustrative-v2", revised["previewManifest"]!["buildId"]!.GetValue<string>());
        await using var database = fixture.CreateContext();
        var original = await database.PublishedFrameworkSnapshots.SingleAsync(item => item.FrameworkId == id && item.Revision == "2");
        Assert.Contains("illustrative-v1", original.MetadataJson); Assert.DoesNotContain("illustrative-v2", original.MetadataJson);

        metadata["preview"] = null;
        Assert.Equal(HttpStatusCode.OK, (await client.PutAsJsonAsync($"/api/maintenance/frameworks/{id:D}", new JsonObject { ["expectedRevision"] = "4", ["metadata"] = metadata.DeepClone() })).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await client.PostAsJsonAsync($"/api/maintenance/frameworks/{id:D}/publish", Publication("5"))).StatusCode);
        Assert.Null((await Details(reader, id))["previewManifest"]);
    }

    [SqlServerFact]
    public async Task InvalidPreviewDefinitionsAreRejectedWithoutWrites()
    {
        await using var fixture = await SqlMaintenanceFixture.CreateAsync();
        using var client = fixture.CreateClient();
        var invalid = new List<JsonObject>();
        foreach (var uri in new[] { "javascript:alert(1)", "http://example.test/bundles/illustrative-v1/index.html", "https://user:password@example.test/bundles/illustrative-v1/index.html", "http://localhost:4180/bundles/illustrative-v1/index.html?secret=1", "http://localhost:4180/bundles/illustrative-v1/index.html#secret", "http://localhost:4180/unrelated.html" })
        {
            var preview = Preview(); preview["previewUri"] = uri; invalid.Add(preview);
        }
        var protocol = Preview(); protocol["protocolVersion"] = 2; invalid.Add(protocol);
        var build = Preview(); build["buildId"] = "../escape"; invalid.Add(build);
        var unknown = Preview(); unknown["componentIds"] = new JsonArray("missing"); invalid.Add(unknown);
        var duplicate = Preview(); duplicate["componentIds"] = new JsonArray("text-input", "text-input"); invalid.Add(duplicate);
        var empty = Preview(); empty["componentIds"] = new JsonArray(); invalid.Add(empty);
        var unlabeled = Preview(); unlabeled.Remove("isIllustrative"); invalid.Add(unlabeled);
        foreach (var preview in invalid)
        {
            var body = SqlMaintenanceFixture.DraftBody(Guid.NewGuid()); body["preview"] = preview;
            var response = await client.PostAsJsonAsync("/api/maintenance/frameworks", body);
            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
            Assert.Contains("preview", await response.Content.ReadAsStringAsync());
        }
        await using var database = fixture.CreateContext();
        Assert.Empty(await database.FrameworkDrafts.ToListAsync());
        Assert.Empty(await database.MaintenanceAuditRecords.ToListAsync());
    }
}
