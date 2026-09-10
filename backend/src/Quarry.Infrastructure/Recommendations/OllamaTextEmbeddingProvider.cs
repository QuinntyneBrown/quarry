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
        var key = _options.CompatibilityKey;
        using var deadline = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        deadline.CancelAfter(TimeSpan.FromSeconds(5));
        try
        {
            await VerifyDigestAsync(deadline.Token);
            using var response = await _client.PostAsJsonAsync("api/embed",
                new { model = _options.Model, input = new[] { input }, truncate = false }, deadline.Token);
            response.EnsureSuccessStatusCode();
            using var document = await JsonDocument.ParseAsync(await response.Content.ReadAsStreamAsync(deadline.Token), cancellationToken: deadline.Token);
            if (document.RootElement.GetProperty("model").GetString() != _options.Model)
                throw new EmbeddingCompatibilityException();
            var embeddings = document.RootElement.GetProperty("embeddings");
            if (embeddings.GetArrayLength() != 1) throw new EmbeddingCompatibilityException();
            var values = embeddings[0].EnumerateArray().Select(value => value.GetSingle()).ToList();
            if (values.Count != _options.Dimensions || values.Any(value => !float.IsFinite(value)) || !values.Any(value => value != 0))
                throw new EmbeddingCompatibilityException();
            await VerifyDigestAsync(deadline.Token);
            return new TextEmbedding(key, values);
        }
        catch (Exception error) when (error is JsonException or KeyNotFoundException or InvalidOperationException or FormatException)
        {
            throw new EmbeddingCompatibilityException();
        }
    }

    private async Task VerifyDigestAsync(CancellationToken cancellationToken)
    {
        using var response = await _client.GetAsync("api/tags", cancellationToken);
        response.EnsureSuccessStatusCode();
        using var document = await JsonDocument.ParseAsync(await response.Content.ReadAsStreamAsync(cancellationToken), cancellationToken: cancellationToken);
        var matching = document.RootElement.GetProperty("models").EnumerateArray()
            .Where(model => model.GetProperty("name").GetString() == _options.Model).ToList();
        if (matching.Count != 1 || !string.Equals(matching[0].GetProperty("digest").GetString(), _options.ModelDigest, StringComparison.OrdinalIgnoreCase))
            throw new EmbeddingCompatibilityException();
    }
}
