using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.Options;
using Quarry.Application.Recommendations;

namespace Quarry.Infrastructure.Recommendations;

public sealed class OllamaTextEmbeddingProvider : ITextEmbeddingProvider
{
    private readonly HttpClient _client;
    private readonly OllamaEmbeddingOptions _options;

    public OllamaTextEmbeddingProvider(HttpClient client, IOptions<OllamaEmbeddingOptions> options)
    {
        _client = client;
        _options = options.Value;
    }

    public async Task<TextEmbedding> EmbedAsync(string input, CancellationToken cancellationToken)
    {
        using var response = await _client.PostAsJsonAsync("api/embed", new { model = _options.Model, input = new[] { input } }, cancellationToken);
        response.EnsureSuccessStatusCode();
        using var document = JsonDocument.Parse(await response.Content.ReadAsStreamAsync(cancellationToken));
        var values = document.RootElement.GetProperty("embeddings")[0].EnumerateArray().Select(value => value.GetSingle()).ToList();
        return new TextEmbedding(_options.Model, values);
    }
}
