using Quarry.Application.Recommendations;

namespace Quarry.Api.AcceptanceTests;

internal sealed class RecordingQueryEmbeddingProvider(ITextEmbeddingProvider provider) : ITextEmbeddingProvider
{
    public TextEmbedding? LastEmbedding { get; private set; }
    public async Task<TextEmbedding> EmbedAsync(string input, CancellationToken cancellationToken)
    {
        LastEmbedding = await provider.EmbedAsync(input, cancellationToken);
        return LastEmbedding;
    }
}
