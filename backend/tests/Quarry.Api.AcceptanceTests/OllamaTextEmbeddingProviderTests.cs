// Acceptance Test
// Traces to: L2-005, L2-041
// Description: The local embedding integration sends versioned input to Ollama and parses its vector response.
using Microsoft.Extensions.Options;
using Quarry.Infrastructure.Recommendations;

namespace Quarry.Api.AcceptanceTests;

public sealed class OllamaTextEmbeddingProviderTests
{
    [Fact]
    public async Task EmbedAsyncPostsConfiguredModelAndReturnsVector()
    {
        var handler = new EmbeddingResponseHandler();
        var client = new HttpClient(handler) { BaseAddress = new Uri("http://localhost:11434/") };
        var options = Options.Create(new OllamaEmbeddingOptions { Model = "embeddinggemma:300m" });
        var provider = new OllamaTextEmbeddingProvider(client, options);

        var embedding = await provider.EmbedAsync("Accessible controls", CancellationToken.None);

        Assert.Equal("embeddinggemma:300m", embedding.Model);
        Assert.Equal([0.25f, 0.75f], embedding.Values);
        Assert.Contains("Accessible controls", handler.RequestBody);
        Assert.Contains("embeddinggemma:300m", handler.RequestBody);
    }
}
