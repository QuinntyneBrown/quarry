using Quarry.Application.Recommendations;

namespace Quarry.Api.AcceptanceTests;

public sealed class IndexingTestEmbeddingProvider : ITextEmbeddingProvider
{
    public int Calls { get; private set; }
    public string? LastInput { get; private set; }
    public bool FailNext { get; set; }

    public Task<TextEmbedding> EmbedAsync(string input, CancellationToken cancellationToken)
    {
        Calls++;
        LastInput = input;
        if (FailNext)
        {
            FailNext = false;
            throw new HttpRequestException("Synthetic provider failure");
        }
        return Task.FromResult(new TextEmbedding("test-model", [1, 0]));
    }
}
