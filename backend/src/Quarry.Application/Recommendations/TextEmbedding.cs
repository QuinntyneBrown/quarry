namespace Quarry.Application.Recommendations;

public sealed record TextEmbedding(string Model, IReadOnlyList<float> Values);
