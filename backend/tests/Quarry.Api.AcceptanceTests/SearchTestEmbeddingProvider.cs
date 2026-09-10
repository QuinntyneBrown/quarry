using Quarry.Application.Recommendations;

namespace Quarry.Api.AcceptanceTests;

internal sealed class SearchTestEmbeddingProvider : ITextEmbeddingProvider
{
    public Task<TextEmbedding> EmbedAsync(string input, CancellationToken cancellationToken)
    {
        return Task.FromResult(new TextEmbedding("test-model", [1f, 0f]));
    }
}
