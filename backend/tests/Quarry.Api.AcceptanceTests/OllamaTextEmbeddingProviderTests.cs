// Acceptance Test
// Traces to: L2-005, L2-041
// Description: The local embedding integration sends versioned input to Ollama and parses its vector response.
using Microsoft.Extensions.Options;
using Quarry.Application.Recommendations;
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

        Assert.Equal("embeddinggemma:300m@85462619ee721b466c5927d109d4cb765861907d5417b9109caebc4e614679f1/768/quarry-embedding-v1", embedding.Model);
        Assert.Equal(768, embedding.Values.Count);
        Assert.All(embedding.Values, value => Assert.Equal(0.25f, value));
        Assert.Equal(2, handler.TagCalls);
        Assert.Contains("Accessible controls", handler.RequestBody);
        Assert.Contains("embeddinggemma:300m", handler.RequestBody);
        Assert.Contains("\"truncate\":false", handler.RequestBody);
    }

    [Fact]
    public async Task UnexpectedInstalledDigestRejectsInputBeforeEmbedding()
    {
        var handler = new EmbeddingResponseHandler { Digest = new string('a', 64) };
        using var client = new HttpClient(handler) { BaseAddress = new Uri("http://localhost:11434/") };
        var provider = new OllamaTextEmbeddingProvider(client, Options.Create(new OllamaEmbeddingOptions()));
        await Assert.ThrowsAsync<EmbeddingCompatibilityException>(() => provider.EmbedAsync("Query", CancellationToken.None));
        Assert.Equal(0, handler.EmbedCalls);
    }

    [Fact]
    public async Task DigestChangeDuringEmbeddingRejectsTheProducedVector()
    {
        var handler = new EmbeddingResponseHandler { DigestAfterEmbedding = new string('a', 64) };
        using var client = new HttpClient(handler) { BaseAddress = new Uri("http://localhost:11434/") };
        var provider = new OllamaTextEmbeddingProvider(client, Options.Create(new OllamaEmbeddingOptions()));
        await Assert.ThrowsAsync<EmbeddingCompatibilityException>(() => provider.EmbedAsync("Query", CancellationToken.None));
    }

    [Theory]
    [InlineData("{\"model\":\"other-model\",\"embeddings\":[[1,0]]}")]
    [InlineData("{\"model\":\"embeddinggemma:300m\",\"embeddings\":[[1,0]]}")]
    [InlineData("{\"model\":\"embeddinggemma:300m\",\"embeddings\":[]}")]
    [InlineData("{\"model\":\"embeddinggemma:300m\",\"embeddings\":[[0,0],[1,0]]}")]
    [InlineData("{\"model\":\"embeddinggemma:300m\"}")]
    public async Task InvalidEmbeddingResponsesAreRejected(string response)
    {
        var handler = new EmbeddingResponseHandler { ResponseJson = response };
        using var client = new HttpClient(handler) { BaseAddress = new Uri("http://localhost:11434/") };
        var provider = new OllamaTextEmbeddingProvider(client, Options.Create(new OllamaEmbeddingOptions()));
        await Assert.ThrowsAsync<EmbeddingCompatibilityException>(() => provider.EmbedAsync("Query", CancellationToken.None));
    }
}
