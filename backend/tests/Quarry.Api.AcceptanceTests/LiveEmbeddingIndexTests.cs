// Acceptance Test
// Traces to: L2-005, L2-008, L2-034, L2-041
// Description: A real local model produces a compatible durable vector in an isolated SQL database.
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Quarry.Infrastructure.Persistence;
using Quarry.Infrastructure.Recommendations;

namespace Quarry.Api.AcceptanceTests;

public sealed class LiveEmbeddingIndexTests
{
    [SqlOllamaFact]
    public async Task LiveModelCompletesDurableWorkWithThePinnedCompatibilityIdentity()
    {
        await using var fixture = await SqlMaintenanceFixture.CreateAsync();
        await using var database = fixture.CreateContext();
        var id = Guid.NewGuid();
        database.FrameworkRevisions.Add(new FrameworkRevisionEntity
        {
            Id = id, Name = "Illustrative integration fixture", Description = "Accessible appointment booking and intake form controls.",
            Technology = "React", TagsJson = "[\"booking\",\"forms\"]", IsPublished = true, Revision = "1"
        });
        await database.SaveChangesAsync();
        var options = new OllamaEmbeddingOptions();
        var repository = new SqlIndexWorkRepository(database);
        await repository.EnqueueMissingAsync(options.CompatibilityKey, CancellationToken.None);
        using var http = new HttpClient { BaseAddress = new Uri(options.Endpoint), Timeout = TimeSpan.FromSeconds(5) };
        var provider = new OllamaTextEmbeddingProvider(http, Options.Create(options));
        var processor = new FrameworkIndexProcessor(database, repository, provider, Options.Create(options), NullLogger<FrameworkIndexProcessor>.Instance);
        Assert.True(await processor.ProcessNextAsync(CancellationToken.None));
        var work = await database.IndexWorkItems.SingleAsync();
        Assert.Equal("completed", work.State);
        Assert.Null(work.LastError);
        var vector = await database.FrameworkVectors.SingleAsync();
        Assert.Equal(options.CompatibilityKey, vector.Model);
        Assert.Equal(options.Dimensions, vector.Dimensions);
        Assert.Equal("1", vector.SourceRevision);
        var snapshot = await new SqlFrameworkVectorRepository(database).GetSnapshotAsync(null, options.CompatibilityKey, options.Dimensions, CancellationToken.None);
        Assert.Equal(id, Assert.Single(snapshot.Candidates).FrameworkId);
        Assert.False(snapshot.IsIncomplete);
    }
}
