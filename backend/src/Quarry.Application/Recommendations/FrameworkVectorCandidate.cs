namespace Quarry.Application.Recommendations;

public sealed record FrameworkVectorCandidate(Guid FrameworkId, string Technology, IReadOnlyList<float> Values);
