// Acceptance Test
// Traces to: L2-004, L2-009, L2-029, L2-041
// Description: SQL catalog pages use ordinal ordering and reject incompatible or stale cursors.
using System.Net;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Quarry.Infrastructure.Persistence;

namespace Quarry.Api.AcceptanceTests;

public sealed class CatalogPaginationTests
{
    private static async Task SeedAsync(SqlMaintenanceFixture fixture)
    {
        await using var database = fixture.CreateContext();
        var names = new[] { "alpha", "Alpha", "Zebra", "_utility", "Äther" }
            .Concat(Enumerable.Range(0, 20).Select(index => $"bravo{index:D2}")).ToArray();
        for (var index = 0; index < names.Length; index++)
            database.FrameworkRevisions.Add(new FrameworkRevisionEntity
            {
                Id = index == 0 ? Guid.Parse("00000001-0000-0000-0000-ffffffffffff")
                    : index == 1 ? Guid.Parse("ffffffff-0000-0000-0000-000000000000")
                    : Guid.Parse($"10000000-0000-0000-0000-{index:D12}"),
                Name = names[index], Description = "Pagination fixture", Technology = "React",
                TagsJson = "[\"fixture\"]", CapabilitiesJson = "[]", ComponentsJson = "[]", UseCasesJson = "[]",
                ComponentCount = 0, IsPublished = true, Revision = "1"
            });
        (await database.CatalogState.SingleAsync()).Revision = 10;
        await database.SaveChangesAsync();
    }

    [SqlServerFact]
    public async Task TwentyFiveEntriesAppearOnceInOrdinalNameAndCanonicalIdOrder()
    {
        await using var fixture = await SqlMaintenanceFixture.CreateAsync();
        await SeedAsync(fixture);
        using var client = fixture.CreateClient(authenticated: false);
        using var first = JsonDocument.Parse(await client.GetStringAsync("/api/frameworks?technology=React"));
        var page = first.RootElement;
        Assert.Equal(25, page.GetProperty("total").GetInt32());
        Assert.Equal("10", page.GetProperty("catalogRevision").GetString());
        Assert.Equal(24, page.GetProperty("items").GetArrayLength());
        var expected = new[] { "alpha", "Alpha" }.Concat(Enumerable.Range(0, 20).Select(index => $"bravo{index:D2}"))
            .Concat(["Zebra", "_utility", "Äther"]).ToArray();
        Assert.Equal(expected.Take(24), page.GetProperty("items").EnumerateArray().Select(item => item.GetProperty("name").GetString()));
        var cursor = Uri.EscapeDataString(page.GetProperty("nextCursor").GetString()!);
        using var second = JsonDocument.Parse(await client.GetStringAsync($"/api/frameworks?technology=React&cursor={cursor}&expectedRevision=10"));
        Assert.Equal("Äther", second.RootElement.GetProperty("items")[0].GetProperty("name").GetString());
        Assert.False(second.RootElement.GetProperty("hasNextPage").GetBoolean());
        Assert.Equal(JsonValueKind.Null, second.RootElement.GetProperty("nextCursor").ValueKind);
        Assert.Equal(25, page.GetProperty("items").EnumerateArray().Concat(second.RootElement.GetProperty("items").EnumerateArray())
            .Select(item => item.GetProperty("id").GetGuid()).Distinct().Count());
    }

    [SqlServerFact]
    public async Task ChangedCatalogRejectsOldCursorAndExpectedRevisionThenAllowsFreshPage()
    {
        await using var fixture = await SqlMaintenanceFixture.CreateAsync();
        await SeedAsync(fixture);
        using var client = fixture.CreateClient(authenticated: false);
        using var first = JsonDocument.Parse(await client.GetStringAsync("/api/frameworks"));
        var cursor = Uri.EscapeDataString(first.RootElement.GetProperty("nextCursor").GetString()!);
        await using var database = fixture.CreateContext();
        await database.Database.ExecuteSqlRawAsync("UPDATE CatalogState SET Revision = 11 WHERE Id = 1;");
        foreach (var suffix in new[] { $"cursor={cursor}", "expectedRevision=10", $"cursor={cursor}&expectedRevision=10" })
        {
            var response = await client.GetAsync($"/api/frameworks?{suffix}");
            Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
            using var error = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
            Assert.Equal("catalog_revision_changed", error.RootElement.GetProperty("code").GetString());
            Assert.False(string.IsNullOrWhiteSpace(error.RootElement.GetProperty("correlationId").GetString()));
        }
        using var refreshed = JsonDocument.Parse(await client.GetStringAsync("/api/frameworks"));
        Assert.Equal("11", refreshed.RootElement.GetProperty("catalogRevision").GetString());
    }

    [SqlServerFact]
    public async Task FilterIncompatibleOrMalformedCursorsAndRevisionsAreRejected()
    {
        await using var fixture = await SqlMaintenanceFixture.CreateAsync();
        await SeedAsync(fixture);
        using var client = fixture.CreateClient(authenticated: false);
        using var first = JsonDocument.Parse(await client.GetStringAsync("/api/frameworks?technology=React"));
        var cursor = Uri.EscapeDataString(first.RootElement.GetProperty("nextCursor").GetString()!);
        foreach (var suffix in new[] { $"cursor={cursor}&technology=Vue", $"cursor={cursor}", "cursor=MA==",
            "cursor=broken", "expectedRevision=01", "expectedRevision=-1", "expectedRevision=abc", "expectedRevision=" + new string('9', 31) })
            Assert.Equal(HttpStatusCode.BadRequest, (await client.GetAsync($"/api/frameworks?{suffix}")).StatusCode);
    }
}
