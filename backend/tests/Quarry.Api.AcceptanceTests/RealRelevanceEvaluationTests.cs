// Acceptance Test
// Traces to: L2-005, L2-006, L2-007, L2-014, L2-041
// Description: Frozen synthetic judgments run through real Ollama embeddings, SQL retrieval, and HTTP search.
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Security.Cryptography;
using Microsoft.AspNetCore.TestHost;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Quarry.Application.Recommendations;
using Quarry.Domain.Catalog;
using Quarry.Infrastructure.Persistence;
using Quarry.Infrastructure.Recommendations;
using Xunit.Abstractions;

namespace Quarry.Api.AcceptanceTests;

public sealed class RealRelevanceEvaluationTests(ITestOutputHelper output)
{
    [SqlOllamaFact]
    public async Task SixSyntheticQueriesMeetTheFrozenCapabilityJudgments()
    {
        const double threshold = SearchRankingConfiguration.RelevanceThreshold;
        await using var fixture = await SqlMaintenanceFixture.CreateAsync();
        await using var database = fixture.CreateContext();
        var options = new OllamaEmbeddingOptions();
        using var http = new HttpClient { BaseAddress = new Uri(options.Endpoint), Timeout = TimeSpan.FromSeconds(5) };
        var provider = new OllamaTextEmbeddingProvider(http, Options.Create(options));
        var catalogBytes = await File.ReadAllBytesAsync(Path.Combine(AppContext.BaseDirectory, "evaluation-catalog.json"));
        using var catalog = JsonDocument.Parse(catalogBytes);
        using var version = JsonDocument.Parse(await http.GetStringAsync("api/version"));
        var labels = new Dictionary<Guid, string>();
        foreach (var entry in catalog.RootElement.EnumerateArray())
        {
            var id = entry.GetProperty("id").GetGuid();
            var metadata = entry.GetProperty("metadata").Deserialize<FrameworkMetadata>(JsonSerializerOptions.Web)!;
            var validated = Framework.CreateDraft(id, metadata);
            labels[id] = entry.GetProperty("fixture").GetString()!;
            var embedding = await provider.EmbedAsync(FrameworkEmbeddingInput.ForFramework(metadata.Description!, metadata.Tags!.Select(tag => tag!).ToArray()), CancellationToken.None);
            database.FrameworkRevisions.Add(new FrameworkRevisionEntity
            {
                Id = id, Name = metadata.Name!, Description = metadata.Description!, Technology = metadata.Technology!, Revision = "1",
                TagsJson = JsonSerializer.Serialize(metadata.Tags), CapabilitiesJson = JsonSerializer.Serialize(metadata.Capabilities),
                ComponentsJson = JsonSerializer.Serialize(metadata.Components), UseCasesJson = JsonSerializer.Serialize(metadata.UseCases),
                ComponentCount = validated.ComponentCount, IsPublished = true
            });
            database.FrameworkVectors.Add(new FrameworkVectorEntity
            {
                FrameworkId = id, SourceRevision = "1", Model = embedding.Model, Dimensions = embedding.Values.Count,
                ValuesJson = JsonSerializer.Serialize(embedding.Values), IndexedAtUtc = DateTimeOffset.UtcNow
            });
        }
        (await database.CatalogState.SingleAsync()).Revision = 1;
        await database.SaveChangesAsync();
        var recorder = new RecordingQueryEmbeddingProvider(provider);
        using var factory = fixture.Factory.WithWebHostBuilder(builder => builder.ConfigureTestServices(services =>
            services.AddSingleton<ITextEmbeddingProvider>(recorder)));
        factory.UseKestrel(server => server.Listen(IPAddress.Loopback, 0));
        using var client = factory.CreateClient();
        var queries = new[] { "Animal Hospital", "I want to build a veterinary clinic application", "Online store",
            "Analytics dashboard", "A pet care practice with booking, client records, and intake forms", "xyzzy unrecognized project" };
        var reports = new List<object>();
        var failures = new List<string>();
        var snapshot = await new SqlFrameworkVectorRepository(database).GetSnapshotAsync(null, options.CompatibilityKey, options.Dimensions, CancellationToken.None);
        foreach (var query in queries)
        {
            var response = await client.PostAsJsonAsync("/api/framework-searches", new { query });
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var result = (await response.Content.ReadFromJsonAsync<FrameworkSearchResult>())!;
            var slugs = result.Items.Select(item => labels[item.Id]).ToArray();
            var passed = query switch
            {
                "Animal Hospital" or "I want to build a veterinary clinic application" => slugs.FirstOrDefault() == "cornerstone"
                    && slugs.Order().SequenceEqual(new[] { "coast", "cornerstone", "form" }),
                "Online store" => slugs.FirstOrDefault() == "mango" && result.Items[0].Explanation.Contains("Product", StringComparison.OrdinalIgnoreCase),
                "Analytics dashboard" => slugs.FirstOrDefault() == "orbit" && result.Items[0].Explanation.Contains("Charts", StringComparison.OrdinalIgnoreCase),
                "A pet care practice with booking, client records, and intake forms" => slugs.Contains("cornerstone") && slugs.Contains("form"),
                _ => slugs.Length == 0
            };
            if (!passed) failures.Add(query);
            var scores = snapshot.Candidates.Select(candidate => new CosineSimilarityRanker()
                .Rank(recorder.LastEmbedding!.Values, [candidate], null, -1).Single())
                .OrderByDescending(item => item.Similarity).Select(item => new { fixture = labels[item.FrameworkId], id = item.FrameworkId, cosine = item.Similarity }).ToArray();
            reports.Add(new { query, passed, catalogRevision = result.CatalogRevision, results = result.Items, allScores = scores });
        }
        var report = JsonSerializer.Serialize(new { model = options.CompatibilityKey, modelName = options.Model,
            modelDigest = options.ModelDigest, dimensions = options.Dimensions, inputVersion = FrameworkEmbeddingInput.Version,
            ollamaVersion = version.RootElement.GetProperty("version").GetString(), recordedAtUtc = DateTimeOffset.UtcNow,
            catalogSha256 = Convert.ToHexString(SHA256.HashData(catalogBytes)),
            threshold, catalogRevision = "1", passed = failures.Count == 0, queries = reports }, new JsonSerializerOptions { WriteIndented = true });
        var reportPath = Environment.GetEnvironmentVariable("QUARRY_EVALUATION_REPORT") ?? Path.Combine(AppContext.BaseDirectory, "relevance-report.json");
        await File.WriteAllTextAsync(reportPath, report);
        output.WriteLine(report);
        Assert.True(failures.Count == 0, "Relevance judgments failed: " + string.Join("; ", failures));
    }
}
