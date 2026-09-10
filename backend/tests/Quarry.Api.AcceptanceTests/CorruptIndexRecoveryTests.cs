// Acceptance Test
// Traces to: L2-005, L2-008, L2-034, L2-036, L2-037, L2-041
// Description: Invalid stored vectors are excluded safely and the documented rebuild restores searchability.
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.TestHost;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Quarry.Application.Recommendations;
using Quarry.Infrastructure.Persistence;
using Quarry.Infrastructure.Recommendations;

namespace Quarry.Api.AcceptanceTests;

public sealed class CorruptIndexRecoveryTests
{
    [SqlServerFact]
    public async Task SearchExcludesCorruptVectorsAndRebuildRestoresAllCurrentRevisions()
    {
        await using var fixture = await SqlMaintenanceFixture.CreateAsync();
        await using var database = fixture.CreateContext();
        var validId = Guid.NewGuid();
        var corruptId = Guid.NewGuid();
        foreach (var id in new[] { validId, corruptId })
        {
            database.FrameworkRevisions.Add(new FrameworkRevisionEntity { Id = id, Name = "Recovery " + id,
                Description = "Scheduling controls", TagsJson = "[\"booking\"]", Technology = "React", Revision = "1", IsPublished = true });
            database.FrameworkVectors.Add(new FrameworkVectorEntity { FrameworkId = id, SourceRevision = "1",
                Model = TestEmbeddingProfile.Key, Dimensions = 2, ValuesJson = "[1,0]", IndexedAtUtc = DateTimeOffset.UtcNow });
        }
        await database.SaveChangesAsync();
        var provider = new IndexingTestEmbeddingProvider();
        using var factory = fixture.Factory.WithWebHostBuilder(builder => builder.ConfigureTestServices(services =>
        {
            services.AddSingleton<ITextEmbeddingProvider>(provider);
            services.PostConfigure<OllamaEmbeddingOptions>(options =>
            {
                options.Model = TestEmbeddingProfile.Options.Model;
                options.ModelDigest = TestEmbeddingProfile.Options.ModelDigest;
                options.Dimensions = 2;
            });
        }));
        factory.UseKestrel(options => options.Listen(IPAddress.Loopback, 0));
        using var client = factory.CreateClient();
        using var credentials = fixture.CreateClient();
        client.DefaultRequestHeaders.Authorization = credentials.DefaultRequestHeaders.Authorization;

        foreach (var invalid in new[] { "private-corrupt-vector-7342", "null", "[]", "[0,0]", "[1]", "[1,2,3]", "[1e50,0]" })
        {
            await database.FrameworkVectors.Where(vector => vector.FrameworkId == corruptId)
                .ExecuteUpdateAsync(setters => setters.SetProperty(vector => vector.ValuesJson, invalid));
            using var response = await client.PostAsJsonAsync("/api/framework-searches", new { query = "Scheduling" });
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var body = await response.Content.ReadAsStringAsync();
            Assert.DoesNotContain("private-corrupt-vector-7342", body);
            using var search = JsonDocument.Parse(body);
            Assert.True(search.RootElement.GetProperty("isIndexIncomplete").GetBoolean());
            Assert.Equal(validId, Assert.Single(search.RootElement.GetProperty("items").EnumerateArray()).GetProperty("id").GetGuid());
            Assert.Equal(HttpStatusCode.ServiceUnavailable, (await client.GetAsync("/health/search")).StatusCode);
            Assert.Equal(HttpStatusCode.OK, (await client.GetAsync("/health/catalog")).StatusCode);
        }
        using var browse = JsonDocument.Parse(await client.GetStringAsync("/api/frameworks"));
        Assert.Equal(2, browse.RootElement.GetProperty("items").GetArrayLength());

        Assert.Equal(HttpStatusCode.Accepted, (await client.PostAsync("/api/maintenance/search-index/rebuild", null)).StatusCode);
        Assert.Empty(await database.FrameworkVectors.AsNoTracking().ToListAsync());
        var processor = new FrameworkIndexProcessor(database, new SqlIndexWorkRepository(database), provider,
            Options.Create(TestEmbeddingProfile.Options), NullLogger<FrameworkIndexProcessor>.Instance);
        Assert.True(await processor.ProcessNextAsync(CancellationToken.None));
        Assert.True(await processor.ProcessNextAsync(CancellationToken.None));
        Assert.False(await processor.ProcessNextAsync(CancellationToken.None));
        using var recovered = await client.PostAsJsonAsync("/api/framework-searches", new { query = "Scheduling" });
        Assert.Equal(HttpStatusCode.OK, recovered.StatusCode);
        using var result = JsonDocument.Parse(await recovered.Content.ReadAsStringAsync());
        Assert.False(result.RootElement.GetProperty("isIndexIncomplete").GetBoolean());
        Assert.Equal(2, result.RootElement.GetProperty("items").GetArrayLength());
        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync("/health/search")).StatusCode);
        Assert.Equal(2, await database.IndexWorkItems.CountAsync(work => work.State == "completed"));
    }
}
