namespace Quarry.Application.Recommendations;

public sealed record VectorSearchSnapshot(IReadOnlyList<FrameworkVectorCandidate> Candidates, bool IsIncomplete);
