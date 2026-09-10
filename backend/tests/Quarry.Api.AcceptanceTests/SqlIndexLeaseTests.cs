// Acceptance Test
// Traces to: L2-008, L2-034, L2-041
// Description: SQL work leases exclude competing workers and survive restarts without stale writes.
using Microsoft.EntityFrameworkCore;
using Quarry.Application.Recommendations;
using Quarry.Infrastructure.Recommendations;

namespace Quarry.Api.AcceptanceTests;

public sealed class SqlIndexLeaseTests
{
    [SqlServerFact]
    public async Task RetryDelayIncreasesToTheThirtySecondCap()
    {
        await using var fixture = await SqlIndexingFixture.CreateAsync();
        await using var database = fixture.CreateContext();
        var repository = new SqlIndexWorkRepository(database);
        foreach (var delay in new[] { 1, 2, 4, 8, 16, 30, 30 })
        {
            var lease = (await repository.ClaimAsync(TestEmbeddingProfile.Key, CancellationToken.None))!;
            Assert.NotNull(lease);
            var before = await database.Database.SqlQueryRaw<DateTimeOffset>("SELECT SYSDATETIMEOFFSET() AS [Value]").SingleAsync();
            await repository.FailAsync(lease, "embedding_service_unavailable", CancellationToken.None);
            var after = await database.Database.SqlQueryRaw<DateTimeOffset>("SELECT SYSDATETIMEOFFSET() AS [Value]").SingleAsync();
            var pending = await database.IndexWorkItems.AsNoTracking().SingleAsync();
            Assert.InRange(pending.NextAttemptAtUtc, before.AddSeconds(delay), after.AddSeconds(delay));
            await database.IndexWorkItems.ExecuteUpdateAsync(setters => setters.SetProperty(work => work.NextAttemptAtUtc, DateTimeOffset.UtcNow.AddSeconds(-1)));
        }
    }

    [SqlServerFact]
    public async Task OnlyOneWorkerCanClaimTheSamePendingRevision()
    {
        await using var fixture = await SqlIndexingFixture.CreateAsync();
        await using var first = fixture.CreateContext();
        await using var second = fixture.CreateContext();
        var claims = await Task.WhenAll(new SqlIndexWorkRepository(first).ClaimAsync(TestEmbeddingProfile.Key, CancellationToken.None),
            new SqlIndexWorkRepository(second).ClaimAsync(TestEmbeddingProfile.Key, CancellationToken.None));
        var lease = Assert.Single(claims, claim => claim is not null)!;
        Assert.Equal(1, lease.AttemptCount);
        Assert.Equal("leased", lease.State);
        Assert.InRange((lease.LeaseExpiresAtUtc!.Value - DateTimeOffset.UtcNow).TotalSeconds, 20, 30);
    }

    [SqlServerFact]
    public async Task RestartReclaimsExpiredLeaseAndRejectsTheFormerOwner()
    {
        await using var fixture = await SqlIndexingFixture.CreateAsync();
        await using var first = fixture.CreateContext();
        var oldRepository = new SqlIndexWorkRepository(first);
        var abandoned = (await oldRepository.ClaimAsync(TestEmbeddingProfile.Key, CancellationToken.None))!;
        Assert.NotNull(abandoned);
        await first.IndexWorkItems.ExecuteUpdateAsync(setters => setters.SetProperty(work => work.LeaseExpiresAtUtc, DateTimeOffset.UtcNow.AddMinutes(-1)));
        await using var restarted = fixture.CreateContext();
        var repository = new SqlIndexWorkRepository(restarted);
        var recovered = (await repository.ClaimAsync(TestEmbeddingProfile.Key, CancellationToken.None))!;
        Assert.NotNull(recovered);
        Assert.NotEqual(abandoned.LeaseId, recovered.LeaseId);
        Assert.Equal(2, recovered.AttemptCount);
        Assert.False(await oldRepository.CompleteAsync(abandoned, new TextEmbedding(TestEmbeddingProfile.Key, [1, 0]), CancellationToken.None));
        Assert.True(await repository.CompleteAsync(recovered, new TextEmbedding(TestEmbeddingProfile.Key, [0, 1]), CancellationToken.None));
        Assert.Equal("[0,1]", (await restarted.FrameworkVectors.SingleAsync()).ValuesJson);
        Assert.Equal("completed", (await restarted.IndexWorkItems.AsNoTracking().SingleAsync()).State);
    }

    [SqlServerFact]
    public async Task ChangedRevisionSupersedesInFlightWorkWithoutWritingAVector()
    {
        await using var fixture = await SqlIndexingFixture.CreateAsync();
        await using var database = fixture.CreateContext();
        var repository = new SqlIndexWorkRepository(database);
        var lease = (await repository.ClaimAsync(TestEmbeddingProfile.Key, CancellationToken.None))!;
        await database.FrameworkRevisions.ExecuteUpdateAsync(setters => setters.SetProperty(framework => framework.Revision, "2"));
        Assert.False(await repository.CompleteAsync(lease, new TextEmbedding(TestEmbeddingProfile.Key, [1, 0]), CancellationToken.None));
        Assert.Empty(await database.FrameworkVectors.ToListAsync());
        Assert.Equal("superseded", (await database.IndexWorkItems.AsNoTracking().SingleAsync()).State);
        await repository.EnqueueMissingAsync(TestEmbeddingProfile.Key, CancellationToken.None);
        Assert.Equal("2", (await repository.ClaimAsync(TestEmbeddingProfile.Key, CancellationToken.None))!.SourceRevision);
    }

    [SqlServerFact]
    public async Task FailedWorkPersistsBackoffAndCanRecover()
    {
        await using var fixture = await SqlIndexingFixture.CreateAsync();
        await using var database = fixture.CreateContext();
        var repository = new SqlIndexWorkRepository(database);
        var lease = (await repository.ClaimAsync(TestEmbeddingProfile.Key, CancellationToken.None))!;
        await repository.FailAsync(lease, "embedding_service_unavailable", CancellationToken.None);
        var pending = await database.IndexWorkItems.AsNoTracking().SingleAsync();
        Assert.Equal("pending", pending.State);
        Assert.Equal("embedding_service_unavailable", pending.LastError);
        Assert.Null(pending.LeaseId);
        Assert.True(pending.NextAttemptAtUtc > DateTimeOffset.UtcNow);
        Assert.Null(await repository.ClaimAsync(TestEmbeddingProfile.Key, CancellationToken.None));
        await database.IndexWorkItems.ExecuteUpdateAsync(setters => setters.SetProperty(work => work.NextAttemptAtUtc, DateTimeOffset.UtcNow.AddSeconds(-1)));
        var retry = (await repository.ClaimAsync(TestEmbeddingProfile.Key, CancellationToken.None))!;
        Assert.True(await repository.CompleteAsync(retry, new TextEmbedding(TestEmbeddingProfile.Key, [1, 0]), CancellationToken.None));
    }

    [SqlServerFact]
    public async Task ChangedModelIdentitySupersedesOldLeasesAndPreventsLateOverwrite()
    {
        await using var fixture = await SqlIndexingFixture.CreateAsync();
        await using var database = fixture.CreateContext();
        var repository = new SqlIndexWorkRepository(database);
        var oldLease = (await repository.ClaimAsync(TestEmbeddingProfile.Key, CancellationToken.None))!;
        var replacementKey = TestEmbeddingProfile.Key.Replace(new string('b', 64), new string('c', 64));
        await repository.EnqueueMissingAsync(replacementKey, CancellationToken.None);
        Assert.Equal("superseded", (await database.IndexWorkItems.SingleAsync(item => item.Id == oldLease.Id)).State);
        var replacementLease = (await repository.ClaimAsync(replacementKey, CancellationToken.None))!;
        Assert.Equal(oldLease.SourceRevision, replacementLease.SourceRevision);
        Assert.True(await repository.CompleteAsync(replacementLease, new TextEmbedding(replacementKey, [0, 1]), CancellationToken.None));
        Assert.False(await repository.CompleteAsync(oldLease, new TextEmbedding(TestEmbeddingProfile.Key, [1, 0]), CancellationToken.None));
        Assert.Equal(replacementKey, (await database.FrameworkVectors.SingleAsync()).Model);
    }
}
