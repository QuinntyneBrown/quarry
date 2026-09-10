namespace Quarry.Application.Recommendations;

public sealed class CosineSimilarityRanker
{
    public IReadOnlyList<FrameworkVectorRanking> Rank(IReadOnlyList<float> query, IEnumerable<FrameworkVectorCandidate> candidates, string? technology, double threshold)
    {
        return candidates
            .Where(candidate => string.IsNullOrWhiteSpace(technology) || string.Equals(candidate.Technology, technology, StringComparison.Ordinal))
            .Select(candidate => new { candidate.FrameworkId, Similarity = Calculate(query, candidate.Values) })
            .Where(candidate => candidate.Similarity >= threshold)
            .OrderByDescending(candidate => candidate.Similarity)
            .ThenBy(candidate => candidate.FrameworkId.ToString("D"), StringComparer.Ordinal)
            .Take(3)
            .Select((candidate, index) => new FrameworkVectorRanking(candidate.FrameworkId, candidate.Similarity, index + 1))
            .ToList();
    }

    private static double Calculate(IReadOnlyList<float> query, IReadOnlyList<float> candidate)
    {
        if (query.Count == 0 || query.Count != candidate.Count)
        {
            return double.NegativeInfinity;
        }

        var dotProduct = 0d;
        var queryMagnitude = 0d;
        var candidateMagnitude = 0d;
        for (var index = 0; index < query.Count; index += 1)
        {
            dotProduct += query[index] * candidate[index];
            queryMagnitude += query[index] * query[index];
            candidateMagnitude += candidate[index] * candidate[index];
        }

        return queryMagnitude == 0d || candidateMagnitude == 0d
            ? double.NegativeInfinity
            : dotProduct / Math.Sqrt(queryMagnitude * candidateMagnitude);
    }
}
