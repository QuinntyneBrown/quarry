// Acceptance Test
// Traces to: L2-007, L2-010, L2-041
// Description: Vector ranking applies eligibility before the three-result limit and breaks equal scores by stable ID.
using Quarry.Application.Recommendations;

namespace Quarry.Api.AcceptanceTests;

public sealed class CosineSimilarityRankerTests
{
    [Fact]
    public void RankFiltersBeforeLimitingAndOrdersTiesByOrdinalFrameworkId()
    {
        var ranker = new CosineSimilarityRanker();
        var candidates = new[]
        {
            new FrameworkVectorCandidate(Guid.Parse("ffffffff-ffff-ffff-ffff-ffffffffffff"), "Angular", [1f, 0f]),
            new FrameworkVectorCandidate(Guid.Parse("00000000-0000-0000-0000-000000000003"), "React", [1f, 0f]),
            new FrameworkVectorCandidate(Guid.Parse("00000000-0000-0000-0000-000000000001"), "React", [1f, 0f]),
            new FrameworkVectorCandidate(Guid.Parse("00000000-0000-0000-0000-000000000002"), "React", [1f, 0f]),
            new FrameworkVectorCandidate(Guid.Parse("00000000-0000-0000-0000-000000000004"), "React", [1f, 0f])
        };

        var results = ranker.Rank([1f, 0f], candidates, "React", 1f);

        Assert.Equal(3, results.Count);
        Assert.Equal(Guid.Parse("00000000-0000-0000-0000-000000000001"), results[0].FrameworkId);
        Assert.Equal(Guid.Parse("00000000-0000-0000-0000-000000000002"), results[1].FrameworkId);
        Assert.Equal(Guid.Parse("00000000-0000-0000-0000-000000000003"), results[2].FrameworkId);
    }
}
