namespace Quarry.Application.Recommendations;

public sealed record FrameworkVectorRanking(Guid FrameworkId, double Similarity, int Rank);
