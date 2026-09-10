namespace Quarry.Application.Recommendations;

public interface ITextEmbeddingProvider
{
    Task<TextEmbedding> EmbedAsync(string input, CancellationToken cancellationToken);
}
