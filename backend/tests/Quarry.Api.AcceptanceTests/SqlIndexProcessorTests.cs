// Acceptance Test
// Traces to: L2-005, L2-008, L2-034, L2-041
// Description: Durable jobs produce current vectors once and recover after provider failure.
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Quarry.Application.Recommendations;
using Quarry.Infrastructure.Recommendations;

namespace Quarry.Api.AcceptanceTests;

public sealed class SqlIndexProcessorTests
{
    [SqlServerFact]
    public async Task CompletedJobsAreNotEmbeddedAgainBySubsequentWorkerPasses()
    {
        await using var fixture = await SqlIndexingFixture.CreateAsync();
        await using var database = fixture.CreateContext();
        var provider = new IndexingTestEmbeddingProvider();
        var repository = new SqlIndexWorkRepository(database);
        var processor = new FrameworkIndexProcessor(database, repository, provider,
            Options.Create(TestEmbeddingProfile.Options), NullLogger<FrameworkIndexProcessor>.Instance);
        Assert.True(await processor.ProcessNextAsync(CancellationToken.None));
        Assert.Equal(FrameworkEmbeddingInput.ForFramework("Scheduling controls", ["booking"]), provider.LastInput);
        Assert.Equal(1, await database.FrameworkVectors.CountAsync());
        await repository.EnqueueMissingAsync(TestEmbeddingProfile.Key, CancellationToken.None);
        Assert.False(await processor.ProcessNextAsync(CancellationToken.None));
        Assert.Equal(1, provider.Calls);
    }

    [SqlServerFact]
    public async Task ProviderFailureRemainsDurableAndAReplacementWorkerCanRecover()
    {
        await using var fixture = await SqlIndexingFixture.CreateAsync();
        var provider = new IndexingTestEmbeddingProvider { FailNext = true };
        await using (var first = fixture.CreateContext())
        {
            var processor = new FrameworkIndexProcessor(first, new SqlIndexWorkRepository(first), provider,
                Options.Create(TestEmbeddingProfile.Options), NullLogger<FrameworkIndexProcessor>.Instance);
            Assert.True(await processor.ProcessNextAsync(CancellationToken.None));
            Assert.Empty(await first.FrameworkVectors.ToListAsync());
            Assert.Equal("embedding_service_unavailable", (await first.IndexWorkItems.SingleAsync()).LastError);
            await first.IndexWorkItems.ExecuteUpdateAsync(setters => setters.SetProperty(work => work.NextAttemptAtUtc, DateTimeOffset.UtcNow.AddSeconds(-1)));
        }
        await using var restarted = fixture.CreateContext();
        var replacement = new FrameworkIndexProcessor(restarted, new SqlIndexWorkRepository(restarted), provider,
            Options.Create(TestEmbeddingProfile.Options), NullLogger<FrameworkIndexProcessor>.Instance);
        Assert.True(await replacement.ProcessNextAsync(CancellationToken.None));
        Assert.Equal("completed", (await restarted.IndexWorkItems.SingleAsync()).State);
        Assert.Equal(1, await restarted.FrameworkVectors.CountAsync());
    }
}
