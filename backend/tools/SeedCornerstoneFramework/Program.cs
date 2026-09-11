using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using SeedCornerstoneFramework;

// One-time, idempotent seed: publishes the real "Cornerstone" framework into Quarry's catalog
// through the same Maintenance API workflow (create draft -> publish) any real maintainer would
// use, from Cornerstone's own generated component catalog. Distinct from the unrelated
// "Cornerstone (evaluation)" fixture in backend/evaluation/catalog.json used by relevance tests.
//
// Cornerstone has 148 real components, but PublishFrameworkCommand requires one evidence URL per
// published capability and component, and Quarry's RequestBodyLimitMiddleware caps every request
// body at 16 KiB (a deliberate security constraint, not something this tool works around). Full
// evidence for all 148 components does not fit in one publish request, so this seed publishes the
// largest representative subset (spread evenly across every category) that fits, and says so
// plainly in its console output. Publishing the remaining components is a follow-up that needs
// either a smaller framework, or a real change to the publish workflow to accept evidence
// incrementally -- not something to fake by shrinking URLs or omitting required evidence.
const string frameworkName = "Cornerstone";
const int maxBodyBytes = 16 * 1024;
const int safetyMarginBytes = 256;
const string repository = "https://github.com/QuinntyneBrown/Cornerstone/blob/main";

var options = ParseOptions(args);
if (options is null) return 1;

var catalogJson = await File.ReadAllTextAsync(options.CatalogPath);
var catalog = JsonSerializer.Deserialize<CornerstoneCatalog>(catalogJson, new JsonSerializerOptions { PropertyNameCaseInsensitive = true })
    ?? throw new InvalidOperationException($"Could not parse {options.CatalogPath}.");

using var client = new HttpClient { BaseAddress = new Uri(options.ApiBaseUrl) };
client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", options.Token);

var existing = await client.GetFromJsonAsync<JsonObject>("/api/frameworks?technology=Angular&pageSize=24");
if (existing?["items"]?.AsArray().Any(item => string.Equals((string?)item?["name"], frameworkName, StringComparison.Ordinal)) == true)
{
    Console.WriteLine($"'{frameworkName}' is already published. Nothing to do.");
    return 0;
}

var categories = catalog.Components.Select(component => component.Category).Distinct(StringComparer.Ordinal).OrderBy(category => category, StringComparer.Ordinal).ToList();
var capabilities = categories.Select(category => new JsonObject
{
    ["id"] = category,
    ["description"] = $"Provides {catalog.Components.Count(component => component.Category == category)} {category} components."
}).ToArray();
var capabilityEvidence = categories.Select(category => new JsonObject
{
    ["targetType"] = "capability", ["targetId"] = category, ["kind"] = "documentation",
    ["source"] = $"{repository}/docs/component-catalog.md"
}).ToArray();

var selected = SelectComponentsWithinBudget(catalog.Components, categories, capabilityEvidence, maxBodyBytes - safetyMarginBytes);
if (selected.Count < catalog.Components.Count)
{
    Console.WriteLine($"Publishing {selected.Count} of {catalog.Components.Count} real Cornerstone components: full-catalog evidence exceeds Quarry's 16 KiB request-body limit in one publish call. Spread evenly across all {categories.Count} categories. Publishing the rest is a follow-up.");
}

var useCases = categories.Select(category => (JsonNode)$"Building {category} interfaces").ToArray();
var tags = new[] { "Angular", "Design System", "Themeable", "Accessible" }.Concat(categories).Select(tag => (JsonNode)tag).ToArray();
var components = selected.Select(component => new JsonObject
{
    ["id"] = component.Slug,
    ["name"] = component.Label,
    ["description"] = component.Description
}).ToArray();

var frameworkId = Guid.NewGuid();
var draftBody = new JsonObject
{
    ["id"] = frameworkId.ToString("D"),
    ["name"] = frameworkName,
    ["description"] = "An Angular component library with a published documentation and design-system site.",
    ["technology"] = "Angular",
    ["tags"] = new JsonArray(tags),
    ["useCases"] = new JsonArray(useCases),
    ["capabilities"] = new JsonArray(capabilities),
    ["components"] = new JsonArray(components),
    ["designSystemUri"] = options.DesignSystemBaseUrl
};

var createResponse = await client.PostAsJsonAsync("/api/maintenance/frameworks", draftBody);
createResponse.EnsureSuccessStatusCode();

var evidence = capabilityEvidence.Concat(selected.Select(component => new JsonObject
{
    ["targetType"] = "component", ["targetId"] = component.Slug, ["kind"] = "working-example",
    ["source"] = $"{repository}/src/cornerstone/{component.Slug}"
})).ToArray();

var publishBody = new JsonObject { ["expectedRevision"] = "1", ["evidence"] = new JsonArray(evidence) };
var publishResponse = await client.PostAsJsonAsync($"/api/maintenance/frameworks/{frameworkId:D}/publish", publishBody);
publishResponse.EnsureSuccessStatusCode();
var published = await publishResponse.Content.ReadFromJsonAsync<JsonObject>();

Console.WriteLine($"Published '{frameworkName}' as {frameworkId:D}, revision {published?["revision"]}, with {components.Length} components and {capabilities.Length} capabilities.");
return 0;

static List<CornerstoneComponentEntry> SelectComponentsWithinBudget(
    IReadOnlyList<CornerstoneComponentEntry> allComponents, List<string> categories, JsonObject[] capabilityEvidence, int budgetBytes)
{
    var byCategory = categories.ToDictionary(category => category,
        category => allComponents.Where(component => component.Category == category)
            .OrderBy(component => component.Slug, StringComparer.Ordinal).ToList());
    var maxPerCategory = byCategory.Values.Max(list => list.Count);

    var selected = new List<CornerstoneComponentEntry>();
    var evidenceSoFar = new List<JsonObject>(capabilityEvidence);
    for (var row = 0; row < maxPerCategory; row++)
    {
        foreach (var category in categories)
        {
            if (row >= byCategory[category].Count) continue;
            var candidate = byCategory[category][row];
            evidenceSoFar.Add(new JsonObject
            {
                ["targetType"] = "component", ["targetId"] = candidate.Slug, ["kind"] = "working-example",
                ["source"] = $"https://github.com/QuinntyneBrown/Cornerstone/blob/main/src/cornerstone/{candidate.Slug}"
            });
            if (MeasureEvidenceBytes(evidenceSoFar) > budgetBytes)
            {
                evidenceSoFar.RemoveAt(evidenceSoFar.Count - 1);
                return selected;
            }
            selected.Add(candidate);
        }
    }
    return selected;
}

static int MeasureEvidenceBytes(List<JsonObject> evidence)
{
    var array = new JsonArray();
    foreach (var item in evidence) array.Add(item.DeepClone());
    var body = new JsonObject { ["expectedRevision"] = "1", ["evidence"] = array };
    return Encoding.UTF8.GetByteCount(body.ToJsonString());
}

static SeedOptions? ParseOptions(string[] arguments)
{
    var values = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
    for (var index = 0; index + 1 < arguments.Length; index += 2)
    {
        values[arguments[index].TrimStart('-')] = arguments[index + 1];
    }
    if (!values.TryGetValue("token", out var token) || string.IsNullOrWhiteSpace(token))
    {
        Console.Error.WriteLine("Usage: dotnet run --project backend/tools/SeedCornerstoneFramework -- --token <maintenance-bearer-token> [--api-base-url http://localhost:5137] [--design-system-base-url http://127.0.0.1:4180/design-systems/cornerstone/] [--catalog-path frameworks/cornerstone/src/docs-app/generated/catalog.json]");
        return null;
    }
    return new SeedOptions(
        token,
        values.GetValueOrDefault("api-base-url", "http://localhost:5137"),
        values.GetValueOrDefault("design-system-base-url", "http://127.0.0.1:4180/design-systems/cornerstone/"),
        values.GetValueOrDefault("catalog-path", "frameworks/cornerstone/src/docs-app/generated/catalog.json"));
}
