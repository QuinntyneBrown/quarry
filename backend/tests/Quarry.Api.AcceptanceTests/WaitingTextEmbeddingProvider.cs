using Quarry.Application.Recommendations;

namespace Quarry.Api.AcceptanceTests;

public sealed class WaitingTextEmbeddingProvider : ITextEmbeddingProvider
{
    public async Task<TextEmbedding> EmbedAsync(string input, CancellationToken cancellationToken)
    {
        await Task.Delay(Timeout.InfiniteTimeSpan, cancellationToken);
        throw new InvalidOperationException("The request deadline must cancel the waiting provider.");
    }
}
